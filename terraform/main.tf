
resource "aws_ecr_repository" "server" {
  name                 = "${var.project_name}-server"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Project   = "AirSafe"
    ManagedBy = "Terraform"
  }
}

# Find the default VPC
data "aws_vpc" "default" {
  default = true
}

# Find available subnets in the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Find the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# Allow access to the backend API
resource "aws_security_group" "server" {
  name        = "${var.project_name}-server-sg"
  description = "AirSafe backend API"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Backend API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-server-sg"
    Project = "AirSafe"
  }
}

# EC2 instance role
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = "AirSafe"
  }
}

# Allow EC2 to pull the image from ECR
resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Allow management through AWS Systems Manager
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# EC2 backend server
resource "aws_instance" "server" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = "t3.micro"
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.server.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -eux

    dnf install -y docker
    systemctl enable --now docker

    aws ecr get-login-password --region ${var.aws_region} \
      | docker login --username AWS --password-stdin \
        ${aws_ecr_repository.server.repository_url}

    docker pull ${aws_ecr_repository.server.repository_url}:v1

    docker run -d --restart unless-stopped \
      --name airsafe-server \
      -p 5000:5000 \
      -e NODE_ENV=production \
      -e PORT=5000 \
      ${aws_ecr_repository.server.repository_url}:v1
  EOF

  tags = {
    Name    = "${var.project_name}-server"
    Project = "AirSafe"
  }
}
