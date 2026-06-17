# Python + AWS — Account Hygiene Auditor (boto3)

A read-only Python script (`script.py`) that uses **boto3** to audit an AWS
account for two of the most common real-world problems: untracked compute and
insecure storage.

## What it does

1. **EC2 inventory** — lists every instance with its ID, type, state, public IP,
   and `Name` tag. You instantly see what is running (and costing money).
2. **S3 security check** — for every bucket it verifies:
   - Server-side **encryption at rest** is enabled.
   - **Public access** is blocked.
   Any bucket that fails is flagged with `[!]`.

The script never modifies the account. It exits `1` when it finds an S3 issue,
so it can be used as a lightweight compliance gate in CI.

## How to run

```bash
pip install boto3

# Credentials are read from the standard AWS chain:
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars,
#   ~/.aws/credentials, or an attached IAM role.
python script.py --region eu-central-1
```

Example output:

```
=== EC2 Instances ===
  i-0a1b2c3d4e5f6      t3.micro     running    public=3.120.10.5     name=web-1

=== S3 Buckets ===
  [ok] my-terraform-state
  [!]  legacy-uploads      NOT ENCRYPTED, PUBLIC ACCESS NOT BLOCKED

Audit complete. 1 S3 finding(s).
```

## Design choices

- **Read-only by design** — an audit tool should never be able to break the thing it inspects.
- **Standard credential chain** — no keys are ever hardcoded; the script works the same on a laptop or inside an IAM-role-bound EC2 instance.
- **Meaningful exit codes** — `0` clean, `1` findings, `2` error — so it behaves well inside automation.

## What I learned

How the `boto3` client maps to AWS APIs, and how to handle the specific
`ClientError` codes AWS returns (for example,
`ServerSideEncryptionConfigurationNotFoundError`) rather than catching errors
blindly. It also reinforced *why* encryption-at-rest and public-access-block
are the first two things to check on any S3 estate.
