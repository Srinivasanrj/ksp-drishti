"""
KSP Sentinel AI — Zoho Enterprise Integration Service (SOLID: SRP, OCP)
======================================================================
Executes real database CRUD operations on local SQLite simulation tables.
Easily swappable with live Zoho Desk REST APIs (Zoho-oauthtoken) in Phase 4.
"""
import os
import sqlite3
import time
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

log = logging.getLogger("investigation.zoho_integration")

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "zoho_simulation.db"


class ZohoIntegrationService:
    """
    Manages Enterprise Tool Execution for Zoho Desk & Zoho CRM.
    Adheres to SOLID: Encapsulates SQL transactions, guarantees valid schemas,
    and returns structured contracts ready for Agent tool consumption.
    """

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Ensure database directory and tables exist with seeded suspect records."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            cur = conn.cursor()
            # 1. Zoho Desk Tickets Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS zoho_desk_tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_number TEXT UNIQUE NOT NULL,
                    district TEXT NOT NULL,
                    police_station TEXT,
                    threat_level TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    status TEXT DEFAULT 'OPEN_ASSIGNED',
                    department TEXT DEFAULT 'Tactical Dispatch & Patrol Response',
                    created_at TEXT NOT NULL
                )
            """)

            # 2. Zoho CRM Suspects Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS zoho_crm_suspects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    suspect_id TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    alias TEXT,
                    primary_crime TEXT NOT NULL,
                    district TEXT NOT NULL,
                    police_station TEXT,
                    known_modus_operandi TEXT,
                    risk_score INTEGER DEFAULT 75,
                    status TEXT DEFAULT 'ACTIVE_SURVEILLANCE'
                )
            """)

            # Seed realistic suspects if table is empty
            cur.execute("SELECT COUNT(*) FROM zoho_crm_suspects")
            count = cur.fetchone()[0]
            if count == 0:
                seed_suspects = [
                    ("SUS-KA-801", "Ramesh 'Blade' Kumar", "Blade", "Robbery & Chain Snatching", "Bengaluru Urban", "Koramangala Police Station", "Uses modified motorcycle for quick getaway during peak transit hours", 92, "ACTIVE_WARRANT"),
                    ("SUS-KA-802", "Mohammed 'Shadow' Imran", "Shadow", "NDPS & Narcotics Smuggling", "Bengaluru Urban", "Indiranagar Police Station", "Distributes synthetic narcotics via encrypted messaging networks", 88, "UNDER_SURVEILLANCE"),
                    ("SUS-KA-803", "Karthik 'Tech' Gowda", "Hacker K", "Cyber Extortion & UPI Fraud", "Bengaluru Urban", "Whitefield Police Station", "Phishing links targeting utility bill payment portals", 95, "FUGITIVE"),
                    ("SUS-KA-804", "Mallesh 'Dada' Naik", "Mallesh Dada", "Commercial Burglary", "Mysuru", "Devaraja Police Station", "Targeting unlocked rear shutters of retail gold/jewelry shops", 78, "BAIL_MONITORED"),
                    ("SUS-KA-805", "Praveen 'Scrap' Shetty", "Scrap Shetty", "Vehicle Theft & Disassembly", "Belagavi", "Belagavi North Sector", "Chassis number tampering and interstate resale", 84, "ACTIVE_SURVEILLANCE"),
                    ("SUS-KA-806", "Syed 'Hawala' Farooq", "Farooq Bhai", "Financial Fraud & Organized Syndicate", "Kalaburagi", "Kalaburagi North Sector", "Cash courier networks across border districts", 90, "ACTIVE_WARRANT"),
                    ("SUS-KA-807", "Dinesh 'Sea' Mendonca", "Captain", "Smuggling & Contraband", "Dakshina Kannada", "Mangaluru Port Sector", "Coastal transit of untaxed liquor and contraband", 81, "UNDER_SURVEILLANCE"),
                    ("SUS-KA-808", "Venkatesh 'Wire' Rao", "Wire Venky", "Theft & Burglary", "Tumakuru", "Tumakuru Central", "Copper cable theft and agricultural transformer dismantling", 74, "BAIL_MONITORED"),
                ]
                cur.executemany("""
                    INSERT INTO zoho_crm_suspects (suspect_id, full_name, alias, primary_crime, district, police_station, known_modus_operandi, risk_score, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, seed_suspects)
                conn.commit()
                log.info(f"[ZohoService] Initialized database and seeded {len(seed_suspects)} suspect profiles.")

    # ── CRUD Operations ────────────────────────────────────────────────────────
    def create_priority_ticket(self, district: str, summary: str, threat_level: str = "HIGH", police_station: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates a new dispatch ticket in Zoho Desk.
        Returns the created ticket contract with ticket_number.
        """
        now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        ticket_num = f"ZD-{int(time.time() * 1000) % 1000000:06d}"
        
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO zoho_desk_tickets (ticket_number, district, police_station, threat_level, summary, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (ticket_num, district, police_station or "Jurisdiction Station", threat_level.upper(), summary, now))
            conn.commit()
            
        log.info(f"[ZohoDesk] Created Ticket '{ticket_num}' for {district} [{threat_level}]")
        return {
            "success": True,
            "ticket_number": ticket_num,
            "district": district,
            "threat_level": threat_level.upper(),
            "summary": summary,
            "status": "OPEN_ASSIGNED",
            "department": "Tactical Dispatch & Patrol Response",
            "created_at": now,
            "message": f"Zoho Desk Priority Ticket #{ticket_num} created and assigned to {district} Tactical Command."
        }

    def query_crm_suspects(self, district: Optional[str] = None, crime_category: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Queries Zoho CRM for known repeat offenders matching district and/or crime category.
        """
        with self._get_connection() as conn:
            cur = conn.cursor()
            query = "SELECT * FROM zoho_crm_suspects WHERE 1=1"
            params = []
            
            if district and district.lower() not in ("all", "karnataka"):
                query += " AND (LOWER(district) LIKE ? OR LOWER(police_station) LIKE ?)"
                params.extend([f"%{district.lower()}%", f"%{district.lower()}%"])
            
            if crime_category and crime_category.lower() not in ("all", "all categories"):
                query += " AND LOWER(primary_crime) LIKE ?"
                params.append(f"%{crime_category.lower()}%")
                
            query += " ORDER BY risk_score DESC LIMIT ?"
            params.append(limit)
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            # Fallback if no exact match
            if not rows and district:
                cur.execute("SELECT * FROM zoho_crm_suspects ORDER BY risk_score DESC LIMIT ?", (limit,))
                rows = cur.fetchall()

            return [
                {
                    "suspect_id": r["suspect_id"],
                    "name": r["full_name"],
                    "alias": r["alias"],
                    "primary_crime": r["primary_crime"],
                    "district": r["district"],
                    "police_station": r["police_station"],
                    "modus_operandi": r["known_modus_operandi"],
                    "risk_score": r["risk_score"],
                    "status": r["status"]
                }
                for r in rows
            ]

    def list_tickets(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List all generated Zoho Desk tickets."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM zoho_desk_tickets ORDER BY id DESC LIMIT ?", (limit,))
            rows = cur.fetchall()
            return [
                {
                    "id": r["id"],
                    "ticket_number": r["ticket_number"],
                    "district": r["district"],
                    "police_station": r["police_station"],
                    "threat_level": r["threat_level"],
                    "summary": r["summary"],
                    "status": r["status"],
                    "department": r["department"],
                    "created_at": r["created_at"]
                }
                for r in rows
            ]


# Global Singleton Instance for Dependency Injection
zoho_service = ZohoIntegrationService()
