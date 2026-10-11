
output "ecr_repository_url" {
  description = "URL of the AirSafe backend ECR repository"
  value       = aws_ecr_repository.server.repository_url
}

output "server_public_ip" {
  description = "Public IP address of the AirSafe backend EC2 instance"
  value       = aws_instance.server.public_ip
}

output "server_api_url" {
  description = "AirSafe backend API base URL"
  value       = "http://${aws_instance.server.public_ip}:5000/api"
}
