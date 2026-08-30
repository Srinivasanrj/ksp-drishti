"""
Generate a genuine synthetic binary PDF for testing KSP Sentinel Document RAG.
"""
import os

def create_synthetic_ksp_fir_pdf(output_path: str):
    """
    Creates a standard valid binary PDF document with police FIR details.
    """
    pdf_text = (
        "KARNATAKA STATE POLICE - FIRST INFORMATION REPORT (CONFIDENTIAL)\n\n"
        "FIR Number: FIR-2026-BGL-CYB-009912\n"
        "Date of Registration: 28-August-2026 | Time: 14:30 HRS\n"
        "Police Station: Cyber Crime Police Station, Central Division, Bengaluru\n"
        "Investigating Officer: Inspector Raghavendra Swamy (Badge #KSP-8812)\n\n"
        "1. ACTS AND STATUTORY SECTIONS APPLIED:\n"
        "- Section 66D, Information Technology Act 2000 (Cheating by personation using computer resource)\n"
        "- Section 318(4), Bharatiya Nyaya Sanhita (BNS) 2023 (Cheating and dishonestly inducing delivery of property)\n"
        "- Section 61(2), Bharatiya Nyaya Sanhita (BNS) 2023 (Criminal Conspiracy)\n\n"
        "2. ACCUSED DETAILS AND IDENTIFICATION:\n"
        "Name: Vikramaditya Hegde (Alias: CryptoVikram)\n"
        "Age: 32 Years | Resident of: Flat 402, Royal Palms, Koramangala 4th Block, Bengaluru\n"
        "Primary Contact: +91-9845012345 | Linked Telegram Handle: @vikram_alpha_nodes\n\n"
        "3. FINANCIAL TRAIL AND MODUS OPERANDI:\n"
        "The complainant, M/s Cauvery Tech Solutions Pvt Ltd, reported an unauthorized transfer of Rs 48,50,000.\n"
        "The stolen funds were routed across four mule bank accounts located in Belagavi District (SBI Account #30981298412)\n"
        "and subsequently converted into USDT cryptocurrency on the WazirX exchange wallet ID: 0x71C9F42A...B8F2.\n\n"
        "4. PHYSICAL EVIDENCE SEIZED AT SCENE:\n"
        "Item 1: Apple MacBook Pro 16-inch (Space Grey), Serial Number: C02XG012J-M1MAX.\n"
        "Item 2: Samsung Galaxy S24 Ultra with Dual SIM cards (IMEI: 354891092837412).\n"
        "Chain of Custody: Placed inside tamper-evident Anti-Static Faraday Bag bearing Barcode: #KSP-FD-7719.\n"
        "Digital evidence certified under Section 65B Bharatiya Sakshya Adhiniyam (BSA) with SHA-256 hash."
    )

    stream_ops = ["BT", "/F1 10 Tf", "40 800 Td", "14 TL"]
    for line in pdf_text.split("\n"):
        clean_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        if "KARNATAKA STATE POLICE" in clean_line:
            stream_ops.append(f"({clean_line}) Tj T*")
        elif clean_line.strip().startswith(("1.", "2.", "3.", "4.")):
            stream_ops.append(f"T* ({clean_line}) Tj T*")
        else:
            stream_ops.append(f"({clean_line}) Tj T*")
    stream_ops.append("ET")
    content_stream = "\n".join(stream_ops)
    stream_len = len(content_stream.encode("ascii"))

    pdf_body = f"""%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595 842]
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
  /Contents 4 0 R
>>
endobj
4 0 obj
<<
  /Length {stream_len}
>>
stream
{content_stream}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000281 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
{281 + stream_len + 50}
%%EOF"""

    with open(output_path, "wb") as f:
        f.write(pdf_body.encode("ascii"))
    
    print(f"Synthetic PDF successfully created at: {output_path} ({os.path.getsize(output_path)} bytes)")


if __name__ == "__main__":
    os.makedirs("tests", exist_ok=True)
    create_synthetic_ksp_fir_pdf("tests/synthetic_fir_case_009912.pdf")
