import logging
import json
from typing import List, Dict, Any
from llm import call_glm
from prompts import PATTERN_MATCHING_PROMPT

logger = logging.getLogger(__name__)

class PatternAgent:
    """
    Autonomous Senior Detective Agent responsible for handling crime narratives,
    interrogation strategy dilemmas, witness notes, and Modus Operandi (M.O.) analysis.
    Uses dynamic LLM reasoning with zero hardcoding to generate tactical investigation advice.
    """
    
    @classmethod
    def run(cls, user_query: str, history: List[Dict[str, str]] = None) -> dict:
        logger.info("[PatternAgent] Starting Senior Detective Investigation & Interrogation Co-Pilot Workflow")
        
        try:
            messages = [
                {"role": "system", "content": PATTERN_MATCHING_PROMPT},
                {"role": "user", "content": f"Investigating Officer's Case Update / Query:\n{user_query}"}
            ]
            
            res = call_glm(messages)
            answer = res.get("response", "").strip()
            
            if not answer:
                answer = (
                    "Hello Officer. I have analyzed your case update. "
                    "Please provide additional details about the incident, witnesses, or suspects so I can assist you with a targeted interrogation and investigation plan."
                )
                
            return {
                "answer": answer,
                "rag_used": False,
                "rag_answer_text": answer
            }
        except Exception as e:
            logger.error(f"[PatternAgent] Error executing pattern matching agent: {e}")
            return {
                "answer": f"Hello Officer. Error analyzing case narrative: {e}",
                "rag_used": False,
                "rag_answer_text": ""
            }
