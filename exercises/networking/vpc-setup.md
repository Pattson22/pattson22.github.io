# Networking Exercise — Building a Secure AWS VPC

A documented, step-by-step walkthrough of designing and building a Virtual
Private Cloud (VPC) on AWS with public and private subnets, routing, gateways,
and least-privilege security groups. This is the foundational networking layer
that every cloud deployment sits on top of.

## Target design

```
VPC  10.0.0.0/16
├── Public Subnet   10.0.1.0/24   (AZ eu-central-1a)  -> Internet Gateway
│     └── ALB / Bastion / NAT Gateway
├── Private Subnet  10.0.2.0/24   (AZ eu-central-1a)  -> NAT Gateway
│     └── Application servers (EC2)
└── Private Subnet  10.0.3.0/24   (AZ eu-central-1b)  -> NAT Gateway
      └── Database (RDS)
```

Goal: anything public-facing lives in the public subnet; application and
database resources live in private subnets and reach the internet only
*outbound* through a NAT gateway. Nothing in a private subnet is directly
reachable from the internet.

## Step 1 — Create the VPC

```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=portfolio-vpc}]'
```

A `/16` gives 65,536 addresses — plenty of room to carve out subnets per tier
and per Availability Zone.

## Step 2 — Create subnets across two Availability Zones

```bash
# Public subnet (AZ a)
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 \
  --availability-zone eu-central-1a

# Private app subnet (AZ a)
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 \
  --availability-zone eu-central-1a

# Private db subnet (AZ b) — second AZ for high availability
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.3.0/24 \
  --availability-zone eu-central-1b
```

Spreading subnets across two AZs is what lets a workload survive the failure
of a whole data centre.

## Step 3 — Internet Gateway (inbound/outbound for public subnet)

```bash
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id <vpc-id> --internet-gateway-id <igw-id>
```

## Step 4 — Route tables

- **Public route table:** a default route `0.0.0.0/0 -> Internet Gateway`, associated with the public subnet.
- **Private route table:** a default route `0.0.0.0/0 -> NAT Gateway`, associated with the private subnets.

```bash
# Public route to the internet
aws ec2 create-route --route-table-id <public-rt> \
  --destination-cidr-block 0.0.0.0/0 --gateway-id <igw-id>

# Private route via NAT (outbound only)
aws ec2 create-route --route-table-id <private-rt> \
  --destination-cidr-block 0.0.0.0/0 --nat-gateway-id <nat-id>
```

## Step 5 — NAT Gateway

Placed in the **public** subnet with an Elastic IP, the NAT gateway lets
private instances download updates and call external APIs *outbound*, while
remaining unreachable *inbound* from the internet.

## Step 6 — Security groups (least privilege)

| Security Group | Inbound | Source |
|----------------|---------|--------|
| `alb-sg`       | 443 (HTTPS) | `0.0.0.0/0` |
| `app-sg`       | 8080 | only `alb-sg` |
| `db-sg`        | 5432 (PostgreSQL) | only `app-sg` |

The key idea: each tier only accepts traffic **from the security group of the
tier directly in front of it** — never from the open internet. The database
can only be reached by the app tier, which can only be reached by the load
balancer.

## Verification

```bash
# Confirm subnet auto-assigns public IPs only where intended
aws ec2 describe-subnets --filters Name=vpc-id,Values=<vpc-id> \
  --query 'Subnets[].{Cidr:CidrBlock,AZ:AvailabilityZone,Public:MapPublicIpOnLaunch}'
```

## What I learned

The VPC is where security really starts. Getting the subnet/route-table/NAT
layout right means private resources are **unreachable by default** — defence
that comes from the network design itself, not from hoping a firewall rule is
correct. Chaining security groups by reference (app accepts only from ALB, DB
accepts only from app) is far more robust than managing CIDR allow-lists by
hand.
