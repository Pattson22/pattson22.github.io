# Networking & Linux Exercise

This folder documents how I build a secure AWS network from the ground up.

See **[`vpc-setup.md`](./vpc-setup.md)** for the full walkthrough:

- Designing a VPC (`10.0.0.0/16`) with public and private subnets across two Availability Zones
- Internet Gateway and NAT Gateway routing
- Public vs. private route tables
- Least-privilege security groups chained by reference (ALB → App → DB)
- Verification commands

## What it demonstrates

Core cloud-networking competence: subnetting, routing, controlling inbound and
outbound traffic, and designing a network where private resources are
unreachable from the internet **by default**.
