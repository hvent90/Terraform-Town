import { useState, useRef, useEffect } from 'react';
import { ui } from '../../theme/tron/colors';

const DEFAULT_CONFIG = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "main-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "public-subnet" }
}

resource "aws_subnet" "private" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags = { Name = "private-subnet" }
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id
  name = "web-sg"
  description = "Web security group"
}

resource "aws_instance" "web1" {
  ami = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  subnet_id = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  tags = { Name = "web-server-1" }
}

resource "aws_instance" "web2" {
  ami = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.small"
  subnet_id = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  tags = { Name = "web-server-2" }
}

resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_iam_role" "lambda" {
  name = "lambda-execution-role"
}`;

type TerraformInputProps = {
  onGenerate: (hcl: string) => void;
};

export function TerraformInput({ onGenerate }: TerraformInputProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(DEFAULT_CONFIG);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleGenerate = () => {
    onGenerate(value);
    setOpen(false);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1001,
          background: open ? ui.accentBg : ui.surface,
          border: `1px solid ${open ? ui.accentBorder : ui.border}`,
          borderRadius: ui.radiusMd,
          padding: '8px 14px',
          fontFamily: ui.font,
          fontSize: 12,
          color: open ? ui.accent : ui.text,
          cursor: 'pointer',
          backdropFilter: `blur(${ui.blur})`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = ui.accentBorder;
          e.currentTarget.style.color = ui.accent;
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = ui.border;
            e.currentTarget.style.color = ui.text;
          }
        }}
      >
        <span style={{ fontSize: 14 }}>{open ? '\u2715' : '\u276E\u276F'}</span>
        <span>Terraform</span>
      </button>

      {/* Panel overlay */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          maxHeight: open ? '70vh' : 0,
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(20px)',
          transition: 'max-height 0.25s ease, opacity 0.2s ease, transform 0.2s ease',
          overflow: 'hidden',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            background: ui.surfaceDense,
            borderTop: `1px solid ${ui.border}`,
            backdropFilter: `blur(${ui.blurHeavy})`,
            fontFamily: ui.font,
            fontSize: 12,
            color: ui.text,
            display: 'flex',
            flexDirection: 'column',
            height: '70vh',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${ui.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 'bold', letterSpacing: '0.05em', color: ui.heading }}>
              Terraform Configuration
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleGenerate}
                style={{
                  background: ui.accentBg,
                  border: `1px solid ${ui.accentBorder}`,
                  borderRadius: ui.radiusSm,
                  padding: '5px 14px',
                  fontFamily: ui.font,
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: ui.accent,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 136, 0, 0.6)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = ui.accentBg;
                  e.currentTarget.style.color = ui.accent;
                }}
              >
                Generate Scene
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: ui.textDim,
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '2px 4px',
                  lineHeight: 1,
                  borderRadius: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = ui.textBright; }}
                onMouseLeave={e => { e.currentTarget.style.color = ui.textDim; }}
              >
                &#x2715;
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div style={{ flex: 1, padding: '8px 16px 16px', overflow: 'hidden' }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${ui.borderFaint}`,
                borderRadius: ui.radiusSm,
                padding: 12,
                fontFamily: ui.font,
                fontSize: 12,
                lineHeight: 1.5,
                color: ui.textBright,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                tabSize: 2,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = ui.accentBorder; }}
              onBlur={e => { e.currentTarget.style.borderColor = ui.borderFaint; }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
