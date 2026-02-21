resource "aws_instance" "test" {
  ami = "ami-0c55b159cbfafe1f0"
  associate_public_ip_address = true
}