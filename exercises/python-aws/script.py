#!/usr/bin/env python3
"""
aws_audit.py — A small AWS account hygiene auditor using boto3.

Scans an AWS account for two common issues a cloud engineer is expected
to catch:

  1. EC2 instances  -> inventory (id, type, state, public IP) so you know
                       exactly what is running and what costs money.
  2. S3 buckets     -> flags buckets that are NOT encrypted at rest, or
                       that allow public access. These are among the most
                       common real-world misconfigurations.

The script is read-only: it never changes anything in the account.

Usage:
    pip install boto3
    # Credentials come from the standard chain:
    #   env vars, ~/.aws/credentials, or an IAM role.
    python aws_audit.py --region eu-central-1
"""

import argparse
import sys

import boto3
from botocore.exceptions import ClientError, NoCredentialsError


def audit_ec2(session) -> None:
    ec2 = session.client("ec2")
    print("\n=== EC2 Instances ===")
    reservations = ec2.describe_instances().get("Reservations", [])
    instances = [i for r in reservations for i in r["Instances"]]

    if not instances:
        print("  (no instances found)")
        return

    for inst in instances:
        name = next(
            (t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"),
            "-",
        )
        print(
            f"  {inst['InstanceId']:<20} {inst['InstanceType']:<12} "
            f"{inst['State']['Name']:<10} public={inst.get('PublicIpAddress', '-'):<15} "
            f"name={name}"
        )


def bucket_is_encrypted(s3, bucket: str) -> bool:
    try:
        s3.get_bucket_encryption(Bucket=bucket)
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ServerSideEncryptionConfigurationNotFoundError":
            return False
        raise


def bucket_blocks_public(s3, bucket: str) -> bool:
    try:
        cfg = s3.get_public_access_block(Bucket=bucket)["PublicAccessBlockConfiguration"]
        return all(cfg.values())
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "NoSuchPublicAccessBlockConfiguration":
            return False
        raise


def audit_s3(session) -> int:
    s3 = session.client("s3")
    print("\n=== S3 Buckets ===")
    buckets = s3.list_buckets().get("Buckets", [])

    if not buckets:
        print("  (no buckets found)")
        return 0

    findings = 0
    for b in buckets:
        name = b["Name"]
        issues = []
        if not bucket_is_encrypted(s3, name):
            issues.append("NOT ENCRYPTED")
        if not bucket_blocks_public(s3, name):
            issues.append("PUBLIC ACCESS NOT BLOCKED")

        if issues:
            findings += 1
            print(f"  [!] {name:<40} {', '.join(issues)}")
        else:
            print(f"  [ok] {name}")

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only AWS hygiene auditor")
    parser.add_argument("--region", default="eu-central-1", help="AWS region")
    args = parser.parse_args()

    try:
        session = boto3.Session(region_name=args.region)
        audit_ec2(session)
        findings = audit_s3(session)
    except NoCredentialsError:
        print("No AWS credentials found. Configure env vars or ~/.aws/credentials.", file=sys.stderr)
        return 2
    except ClientError as exc:
        print(f"AWS error: {exc}", file=sys.stderr)
        return 2

    print(f"\nAudit complete. {findings} S3 finding(s).")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
