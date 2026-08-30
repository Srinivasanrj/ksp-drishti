"""
Phase 4 Unified Global Chatbot & Agentic Swarm Integration Test Suite
=====================================================================
Validates:
1. Master /chat router with context_injection
2. SpatialTacticalAgent polymorphic execution
3. Real Zoho CRM and Zoho Desk SQLite CRUD tool executions
4. Continuous session memory integration
"""
import unittest
import urllib.request
import json

BASE = 'http://127.0.0.1:5000'


def req(path, method='GET', payload=None):
    r = urllib.request.Request(BASE + path, method=method)
    if payload is not None:
        r.add_header('Content-Type', 'application/json')
        r.data = json.dumps(payload).encode('utf-8')
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode('utf-8'))


class TestPhase4UnifiedSwarm(unittest.TestCase):

    def test_01_standard_chat_without_context(self):
        res = req('/chat', 'POST', {
            'query': 'Hello Sentinel, what is your operational status?',
            'session_id': 'test_phase4_session_001'
        })
        self.assertTrue(res.get('success', False))
        self.assertIn('answer', res)
        self.assertGreater(len(res['answer']), 10)

    def test_02_spatial_context_injection_crm_query(self):
        res = req('/chat', 'POST', {
            'query': 'Check Zoho CRM for repeat suspects operating in this district.',
            'session_id': 'test_phase4_session_001',
            'division': 'Bengaluru Urban',
            'context_injection': {
                'trigger_source': 'geospatial_dossier',
                'spatial_context': {
                    'district_name': 'Bengaluru Urban',
                    'center_coordinates': [12.9716, 77.5946]
                },
                'hotspot_metadata': {
                    'threat_level': 'CRITICAL',
                    'incident_count': 55
                }
            }
        })
        self.assertTrue(res.get('success', False))
        self.assertEqual(res.get('agent_type'), 'spatial_tactical_agent')
        self.assertIn('Bengaluru', res.get('answer', ''))

    def test_03_spatial_context_injection_zoho_desk_ticket(self):
        res = req('/chat', 'POST', {
            'query': 'Log a critical priority tactical dispatch ticket in Zoho Desk for immediate action.',
            'session_id': 'test_phase4_session_001',
            'division': 'Bengaluru Urban',
            'context_injection': {
                'trigger_source': 'geospatial_dossier',
                'spatial_context': {
                    'district_name': 'Bengaluru Urban',
                    'center_coordinates': [12.9716, 77.5946]
                },
                'hotspot_metadata': {
                    'threat_level': 'CRITICAL',
                    'incident_count': 55
                }
            }
        })
        self.assertTrue(res.get('success', False))
        self.assertEqual(res.get('agent_type'), 'spatial_tactical_agent')
        answer = res.get('answer', '')
        # Verify ticket was generated and returned
        self.assertTrue('ZD-' in answer or 'Ticket' in answer)

    def test_04_verify_zoho_desk_db_persistence(self):
        tickets = req('/api/investigation/tickets')
        self.assertTrue(tickets.get('success', False))
        self.assertGreaterEqual(tickets.get('count', 0), 1)

    def test_05_continuous_session_followup(self):
        # In the exact same session_id, ask a follow-up
        res = req('/chat', 'POST', {
            'query': 'Suggest checkpoint locations and patrol frequency.',
            'session_id': 'test_phase4_session_001',
            'division': 'Bengaluru Urban'
        })
        self.assertTrue(res.get('success', False))
        self.assertIn('answer', res)

    def test_06_greeting_fastpath_hi(self):
        # Verify "hi" is treated as CONVERSATIONAL and not blocked by guardrail
        res = req('/chat', 'POST', {
            'query': 'hi',
            'session_id': 'test_greeting_session'
        })
        self.assertTrue(res.get('success', False))
        self.assertEqual(res.get('agent_type'), 'conversational_agent')
        self.assertNotIn('⚠️ **KSP Sentinel Operational Guardrail**', res.get('answer', ''))

    def test_07_identity_fastpath_who_are_you(self):
        # Verify "who are you" is treated as CONVERSATIONAL and explains Sentinel AI identity
        res = req('/chat', 'POST', {
            'query': 'who are you',
            'session_id': 'test_greeting_session'
        })
        self.assertTrue(res.get('success', False))
        self.assertEqual(res.get('agent_type'), 'conversational_agent')
        self.assertNotIn('⚠️ **KSP Sentinel Operational Guardrail**', res.get('answer', ''))

    def test_08_strict_guardrail_off_topic(self):
        # Verify off-topic recipe is strictly intercepted by guardrail
        res = req('/chat', 'POST', {
            'query': 'write a recipe for chocolate cake',
            'session_id': 'test_guardrail_session'
        })
        self.assertTrue(res.get('success', False))
        self.assertEqual(res.get('agent_type'), 'guardrail_agent')
        self.assertIn('⚠️ **KSP Sentinel Operational Guardrail**', res.get('answer', ''))


if __name__ == '__main__':
    unittest.main()
