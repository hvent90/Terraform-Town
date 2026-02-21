resource "aws_subnet" "test" {
  vpc_id = aws_vpc.test.id
}