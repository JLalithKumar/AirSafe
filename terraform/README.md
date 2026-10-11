# AirSafe Infrastructure as Code (Terraform)

Terraform configurations for provisioning cloud resources on **Amazon Web Services (AWS)** for the AirSafe application.

---

## 1. Architecture & Infrastructure Scope

The Terraform codebase provisions the core cloud infrastructure required to host and operate the AirSafe containerized backend:
1. **Amazon ECR (Elastic Container Registry)**: A private, encrypted container image repository (`airsafe-server`) with image vulnerability scanning on push.
2. **Amazon EC2 (Compute)**: A single `t3.micro` instance running Amazon Linux 2023 in the default AWS VPC.
3. **AWS IAM (Identity & Access Management)**: An EC2 IAM Instance Profile granting:
   - `AmazonEC2ContainerRegistryReadOnly`: Allows the EC2 instance to pull images from ECR without storing long-lived AWS access keys.
   - `AmazonSSMManagedInstanceCore`: Allows remote management and terminal access via AWS Systems Manager (SSM) Session Manager without requiring open SSH ports.
4. **Security Groups**: An EC2 security group allowing inbound HTTP traffic on port `5000` from `0.0.0.0/0` and unrestricted outbound egress.

```
                  ┌────────────────────────────────────────┐
                  │               AWS Cloud                │
                  │                                        │
┌──────────────┐  │   ┌───────────────┐                    │
│ Docker Image │──┼──>│  Amazon ECR   │                    │
│   (Server)   │  │   │ airs-server:v1│                    │
└──────────────┘  │   └───────┬───────┘                    │
                  │           │ (IAM Role Pull)            │
                  │           ▼                            │
                  │   ┌───────────────┐                    │
                  │   │  Amazon EC2   │◄── Ingress: 5000   │
                  │   │  (t3.micro)   │    (HTTP API)      │
                  │   └───────────────┘                    │
                  │           │ (Outbound)                 │
                  │           ▼                            │
                  │   ┌───────────────┐                    │
                  │   │ MongoDB Atlas │                    │
                  │   └───────────────┘                    │
                  └────────────────────────────────────────┘
```

---

## 2. Resources Declared in Terraform

All infrastructure resources are declared in [`terraform/main.tf`](main.tf):

| Resource / Data Source | Identifier | Description |
| :--- | :--- | :--- |
| `resource "aws_ecr_repository"` | `server` | ECR repository `${var.project_name}-server` with `AES256` encryption and scan-on-push. Image tag mutability is set to `IMMUTABLE`. |
| `resource "aws_security_group"` | `server` | `${var.project_name}-server-sg` controlling ingress on TCP port `5000` and all outbound traffic. |
| `resource "aws_iam_role"` | `ec2` | `${var.project_name}-ec2-role` with `ec2.amazonaws.com` assume-role policy. |
| `resource "aws_iam_role_policy_attachment"` | `ecr_read` | Attaches `AmazonEC2ContainerRegistryReadOnly` policy to the EC2 role. |
| `resource "aws_iam_role_policy_attachment"` | `ssm` | Attaches `AmazonSSMManagedInstanceCore` policy for Systems Manager management. |
| `resource "aws_iam_instance_profile"` | `ec2` | `${var.project_name}-ec2-profile` associating the IAM role with the EC2 instance. |
| `resource "aws_instance"` | `server` | `t3.micro` EC2 instance using the latest Amazon Linux 2023 AMI, associated with the default VPC subnet, public IP enabled, and user data bootstrap script. |
| `data "aws_vpc"` | `default` | Queries the default AWS VPC. |
| `data "aws_subnets"` | `default` | Queries available subnets within the default VPC. |
| `data "aws_ami"` | `amazon_linux` | Queries the most recent official Amazon Linux 2023 x86_64 AMI (`al2023-ami-2023.*-x86_64`). |

---

## 3. Configuration Variables & Defaults

Variables are declared in [`terraform/variables.tf`](variables.tf):

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `aws_region` | `string` | `"us-east-1"` | Target AWS region for all resources. |
| `project_name` | `string` | `"airsafe"` | Project identifier used to prefix all created resource names. |

### Provider Configuration
Configured in [`terraform/providers.tf`](providers.tf):
```hcl
provider "aws" {
  region  = var.aws_region
  profile = "airsafe-deploy"
}
```
The provider expects an AWS CLI profile named `airsafe-deploy`. You can override the profile by setting the `AWS_PROFILE` environment variable or editing `providers.tf`.

---

## 4. Prerequisites

1. **Terraform CLI**: Version `>= 1.5.0` installed.
2. **AWS CLI**: Version 2 installed and configured with credentials for profile `airsafe-deploy`:
   ```bash
   aws configure --profile airsafe-deploy
   ```
3. **Docker**: Running locally to build and push the server image to ECR.

---

## 5. Terraform Workflow & Deployment Commands

Execute all commands from inside the `terraform/` directory:

```bash
cd terraform
```

### Step 1: Initialize Working Directory
Downloads the AWS provider (`hashicorp/aws ~> 6.0`) and verifies the lockfile:
```bash
terraform init
```

### Step 2: Validate & Format
```bash
terraform fmt -check
terraform validate
```

### Step 3: Plan Infrastructure Changes
Generates an execution plan without applying changes:
```bash
terraform plan
```

### Step 4: Important Deployment Sequence (ECR Image Prerequisite)

The EC2 instance `user_data` script in `main.tf` runs the following startup commands:
```bash
aws ecr get-login-password --region ${var.aws_region} | docker login ...
docker pull ${aws_ecr_repository.server.repository_url}:v1
docker run -d --restart unless-stopped --name airsafe-server -p 5000:5000 ... :v1
```

Because EC2 attempts to pull `:v1` immediately on boot, follow this deployment sequence:

1. **First, provision the ECR repository**:
   ```bash
   terraform apply -target=aws_ecr_repository.server
   ```
2. **Build and push the backend Docker image to ECR**:
   ```bash
   # Authenticate Docker to ECR
   aws ecr get-login-password --region us-east-1 --profile airsafe-deploy | \
     docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url)

   # Build image from server directory
   docker build -t airsafe-server:v1 ../server

   # Tag and push to ECR
   docker tag airsafe-server:v1 $(terraform output -raw ecr_repository_url):v1
   docker push $(terraform output -raw ecr_repository_url):v1
   ```
3. **Apply the remaining infrastructure (Security Group, IAM Role, EC2)**:
   ```bash
   terraform apply
   ```

---

## 6. Terraform Outputs

Outputs are defined in [`terraform/outputs.tf`](outputs.tf):

```bash
terraform output
```

| Output Name | Type | Description |
| :--- | :--- | :--- |
| `ecr_repository_url` | String | Fully qualified URL of the created Amazon ECR repository (e.g., `<account-id>.dkr.ecr.us-east-1.amazonaws.com/airsafe-server`). |
| `server_public_ip` | String | Public IPv4 address assigned to the EC2 backend instance. |
| `server_api_url` | String | Formatted backend API URL (`http://<server_public_ip>:5000/api`). |

---

## 7. Supplying Application Environment Variables to the Container

In `main.tf`, the container is started with basic environment flags:
```bash
docker run -d --restart unless-stopped \
  --name airsafe-server \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  ${aws_ecr_repository.server.repository_url}:v1
```

To supply required application secrets (such as `MONGODB_URI`, `OPENWEATHER_API_KEY`, `SESSION_SECRET`, and `GOOGLE_CLIENT_ID`) safely:
1. **Never hardcode secrets into Terraform files or user data.**
2. Use **AWS Systems Manager Session Manager** to connect to the instance securely:
   ```bash
   aws ssm start-session --target <instance-id> --profile airsafe-deploy
   ```
3. Create `/app/.env` on the host, or retrieve secrets from AWS SSM Parameter Store / Secrets Manager using the IAM role, and restart the container:
   ```bash
   docker run -d --restart unless-stopped \
     --name airsafe-server \
     -p 5000:5000 \
     --env-file /etc/airsafe.env \
     <ecr-repository-url>:v1
   ```

---

## 8. Safe State Management & Security Considerations

- **State Files Are Ignored**: `terraform.tfstate`, `terraform.tfstate.backup`, `*.tfvars`, and `.tfplan` files contain resource metadata, resource IDs, and sensitive properties. They are strictly excluded by `.gitignore`.
- **Lock File**: `.terraform.lock.hcl` is committed to version control to guarantee that all environments use identical provider versions.
- **No Direct SSH Keys**: The EC2 instance does not require an SSH key pair (`key_name`). Remote access is handled via the attached `AmazonSSMManagedInstanceCore` role, eliminating exposed port 22.
- **Port 5000 Ingress**: Security group ingress currently opens TCP port `5000` to `0.0.0.0/0` for direct HTTP access. For production, traffic should be routed through an Application Load Balancer (ALB) or reverse proxy terminating TLS (HTTPS).

---

## 9. Inspecting & Destroying Infrastructure

### Inspect State
```bash
terraform show
terraform state list
```

### Safely Destroy Infrastructure
When tearing down test environments to prevent recurring AWS charges:
```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy resources
terraform destroy
```

> **Note on ECR Deletion**: If container images remain inside the ECR repository, Amazon ECR may prevent repository deletion until images are deleted. To force deletion, delete images via AWS CLI first:
> ```bash
> aws ecr batch-delete-image \
>   --repository-name airsafe-server \
>   --image-ids imageTag=v1 \
>   --profile airsafe-deploy
> ```
