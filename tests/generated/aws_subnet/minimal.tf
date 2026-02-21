resource "aws_subnet" "test" {
  vpc_id = "placeholder-vpc_id"
  availability_zone = "us-east-1a"
  cidr_block = "10.0.0.0/16"
}