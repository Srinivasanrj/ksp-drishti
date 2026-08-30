import os
from pathlib import Path
import datetime

def generate_golden_firs():
    base_dir = Path("D:/DATATHON/DATATHON/data_for_ai/golden_firs")
    base_dir.mkdir(parents=True, exist_ok=True)
    
    firs = [
        # Bengaluru City
        {
            "filename": "FIR-GOLDEN-001_Bengaluru.txt",
            "content": "FIR Number: FIR-2025-BLR-001\nDivision: Bengaluru City (South Bengaluru)\nDate: 2025-03-12\nCrime Category: Burglary\nNarrative: The complainant reported a break-in at their residence. Investigation revealed the suspect gained entry by smashing the bathroom window located at the rear of the property. The house was ransacked. Upon fleeing, the suspect notably left the house keys resting on the dining table. Fingerprints were lifted from the window sill."
        },
        {
            "filename": "FIR-GOLDEN-002_Bengaluru.txt",
            "content": "FIR Number: FIR-2025-BLR-002\nDivision: Bengaluru City\nDate: 2025-05-18\nCrime Category: Cyber Crime / Fraud\nNarrative: Victim lured into a cryptocurrency investment scheme via the Telegram app. After transferring digital assets, the suspects convinced the victim to physically hand over INR 5 Lakhs cash at a cafe in Koramangala. CCTV footage shows the suspect arriving on a scooter, using a Swiggy delivery bag as a decoy to collect the cash unnoticed."
        },
        {
            "filename": "FIR-GOLDEN-003_Bengaluru.txt",
            "content": "FIR Number: FIR-2025-BLR-003\nDivision: Bengaluru City\nDate: 2025-07-22\nCrime Category: Vehicle Theft\nNarrative: A series of high-end motorcycle thefts reported in HSR Layout. The gang specifically targets Royal Enfield Interceptor 650 motorcycles. CCTV confirms they use programmable OBD-port hacking tools to bypass the immobilizer. These thefts strictly occur between 01:00 AM and 04:00 AM on rainy nights to mask noise and avoid patrols."
        },
        
        # Mysuru City
        {
            "filename": "FIR-GOLDEN-004_Mysuru.txt",
            "content": "FIR Number: FIR-2022-MYS-004\nDivision: Mysuru City\nDate: 2022-11-05\nCrime Category: ATM Robbery\nNarrative: Historical record of an ATM breach. Suspects disabled the CCTV cameras with spray paint. They breached the ATM cash dispenser using an acetylene torch, leaving distinct cut marks on the lower hinge of the vault door. The incident occurred precisely at 03:00 AM. Total cash stolen was INR 12 Lakhs."
        },
        {
            "filename": "FIR-GOLDEN-005_Mysuru.txt",
            "content": "FIR Number: FIR-2025-MYS-005\nDivision: Mysuru City\nDate: 2025-02-14\nCrime Category: Robbery / Chain Snatching\nNarrative: A series of chain snatching incidents reported outside the Chamundeshwari Temple. The primary suspect is disguised as a Zomato delivery rider, wearing a red jacket and helmet. The suspect specifically targets elderly women walking alone during early morning hours, typically around 06:00 AM."
        },
        {
            "filename": "FIR-GOLDEN-006_Mysuru.txt",
            "content": "FIR Number: FIR-2025-MYS-006\nDivision: Mysuru City\nDate: 2025-08-09\nCrime Category: Extortion\nNarrative: Local gang demanding protection money from heritage hotel owners. Suspects strictly communicate using the encrypted Signal app to avoid interception. Physical threats are delivered by dropping threatening letters wrapped in a red cloth at the hotel reception."
        },
        
        # Hubballi Dharwad City
        {
            "filename": "FIR-GOLDEN-007_Hubballi.txt",
            "content": "FIR Number: FIR-2025-HUB-007\nDivision: Hubballi Dharwad City\nDate: 2025-01-20\nCrime Category: ATM Robbery\nNarrative: Recent ATM robbery reported at Vidyanagar. The Modus Operandi matches a known 2022 Mysuru gang. The suspects used an acetylene torch to cut the vault, leaving identical cut marks on the lower hinge. The robbery was executed precisely at 03:00 AM."
        },
        {
            "filename": "FIR-GOLDEN-008_Hubballi.txt",
            "content": "FIR Number: FIR-2025-HUB-008\nDivision: Hubballi Dharwad City\nDate: 2025-06-11\nCrime Category: Smuggling / Excise Act\nNarrative: Interception of inter-state liquor smuggling on the Pune-Bengaluru highway. The syndicate uses modified private sleeper buses for transport. During inspection, massive quantities of contraband liquor were found cleverly hidden inside the central air-conditioning vents of the bus."
        },
        {
            "filename": "FIR-GOLDEN-009_Hubballi.txt",
            "content": "FIR Number: FIR-2025-HUB-009\nDivision: Hubballi Dharwad City\nDate: 2025-09-02\nCrime Category: Assault / Riot\nNarrative: A violent group clash occurred at the old bus depot over territorial disputes. Witnesses reported the suspects used iron rods and hockey sticks. Three suspects arrested at the scene were identified as belonging to the same gang by matching tattoos of a black scorpion on their right forearms."
        },
        
        # Tumakuru
        {
            "filename": "FIR-GOLDEN-010_Tumakuru.txt",
            "content": "FIR Number: FIR-2025-TUM-010\nDivision: Tumakuru\nDate: 2025-04-10\nCrime Category: Chain Snatching\nNarrative: Unsolved case of chain snatching near the town square. The victim reported that the lone assailant was riding a stolen black Pulsar 220 motorcycle with no license plates. The incident occurred exactly at 19:30 hours. The suspect was wearing a dark full-face helmet."
        },
        {
            "filename": "FIR-GOLDEN-011_Tumakuru.txt",
            "content": "FIR Number: FIR-2025-TUM-011\nDivision: Tumakuru\nDate: 2025-10-30\nCrime Category: Highway Dacoity\nNarrative: Organized highway robbery on NH48. Suspects hide in the median bushes at night. Their M.O. involves throwing raw eggs at the windshields of passing cars. When drivers use wipers, it smears the glass, forcing them to stop. Suspects then surround the vehicle and rob the occupants at knifepoint."
        },
        {
            "filename": "FIR-GOLDEN-012_Tumakuru.txt",
            "content": "FIR Number: FIR-2025-TUM-012\nDivision: Tumakuru\nDate: 2025-12-05\nCrime Category: Agricultural Theft\nNarrative: Reports of organized theft targeting rural farms. Suspects are stealing high-value arecanut yields and stripping copper irrigation pipes from water pumps. Multiple eyewitnesses reported seeing the suspects loading the stolen goods into a white Bolero pickup truck with a distinctly faded red front bumper."
        },
        
        # Belagavi Dist
        {
            "filename": "FIR-GOLDEN-013_Belagavi.txt",
            "content": "FIR Number: FIR-2025-BEL-013\nDivision: Belagavi Dist\nDate: 2025-02-28\nCrime Category: NDPS (Drug Smuggling)\nNarrative: Narcotics raid conducted near a local university campus. Suspect arrested for distributing MDMA to students. The M.O. involved smuggling the synthetic drugs across state borders cleverly concealed inside hollowed-out college engineering textbooks to avoid detection by sniffer dogs."
        },
        {
            "filename": "FIR-GOLDEN-014_Belagavi.txt",
            "content": "FIR Number: FIR-2025-BEL-014\nDivision: Belagavi Dist\nDate: 2025-11-15\nCrime Category: Human Trafficking / Fraud\nNarrative: A fake nursing job recruitment agency busted. Suspects targeted unemployed rural youth with false promises of high-paying hospital jobs abroad. The entire operation was run out of a remote rented farmhouse near the Maharashtra border, acting as a transit point before moving victims."
        },
        {
            "filename": "FIR-GOLDEN-015_Belagavi.txt",
            "content": "FIR Number: FIR-2025-BEL-015\nDivision: Belagavi Dist\nDate: 2025-07-08\nCrime Category: Arms Act\nNarrative: Intelligence-led raid resulted in the seizure of 24 country-made pistols. The weapons were being manufactured in illegal foundries that were disguised externally as agricultural tool sheds. Suspects used standard lathe machines to bore barrels, supplying local gangs across the border."
        }
    ]

    for fir in firs:
        filepath = base_dir / fir["filename"]
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(fir["content"])
        print(f"Generated: {filepath.name}")

if __name__ == "__main__":
    generate_golden_firs()
    print("\nSuccessfully generated 15 Golden FIR datasets for Unstructured RAG testing.")
