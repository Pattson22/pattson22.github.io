# Cloud Engineering Portfolio — Patrick Thompson

## Overview
This repository hosts my computer science portfolio website, built to showcase
my skills as a **Cloud Engineer**. The portfolio is part of my **B201 Computer
Science Lab** module at **GISMA University of Applied Sciences**, and is aimed
at hiring managers recruiting for working student (Werkstudent) cloud
engineering roles in Germany.

## Live Website
**[https://pattson22.github.io](https://pattson22.github.io)**

## Repository Structure
```
pattson22.github.io/
├── index.html                 # Portfolio website
├── style.css                  # Styling (dark/light theme, AWS-orange accent)
├── script.js                  # Theme toggle, scroll reveals, live GitHub feed
├── assets/                    # Images & architecture diagrams (SVG)
│   ├── multi-tier-architecture.svg
│   └── crypto-api-architecture.svg
├── cv/                        # CV created with LaTeX
│   ├── cv.tex
│   ├── cv.pdf
│   └── README.md
├── exercises/                 # Technical exercises (CS fundamentals)
│   ├── bash-automation/       # Server bootstrap & health-check script
│   ├── python-aws/            # boto3 AWS account auditor
│   └── networking/            # VPC / subnets / security groups walkthrough
├── report/                    # B201 project report (LaTeX)
│   ├── report.tex
│   └── report.pdf
└── README.md
```

## Technologies Used
- **HTML5, CSS3, JavaScript** — the website (no framework, no build step)
- **GitHub Pages** — hosting
- **GitHub REST API** — live repository feed
- **LaTeX (Overleaf)** — CV and project report
- **draw.io** — architecture diagrams

## Featured Projects
1. **Multi-tier Cloud Application** — Terraform, AWS, Docker, CI/CD
2. **Highly Available Crypto API** — Terraform, AWS, Multi-AZ, Auto Scaling
3. **MLOps API Infrastructure** — AWS, Docker, Python
4. **Group Chat Application** — Python, full-stack, real-time
5. **Simple Shell** — C, Linux / OS fundamentals

## Technical Exercises
- **Bash automation** — idempotent server bootstrap + health checks
- **Python + AWS (boto3)** — read-only account hygiene auditor
- **Networking** — building a secure VPC with least-privilege security groups

## Running Locally
This is a static site — just open `index.html` in a browser, or serve it:
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Author
**Patrick Thompson** — BSc Computer Science, GISMA University of Applied Sciences
[github.com/pattson22](https://github.com/pattson22) ·
[LinkedIn](https://linkedin.com/in/patrick-thompson-abb9a3367/)
