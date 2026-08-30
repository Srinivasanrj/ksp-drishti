"""
Live System Endpoint Verification Test Script (Phase 1, 2, 3 Integration)
"""
import urllib.request
import json
import unittest

BASE = 'http://127.0.0.1:5000'

def req(path, method='GET', payload=None):
    r = urllib.request.Request(BASE + path, method=method)
    if payload is not None:
        r.add_header('Content-Type', 'application/json')
        r.data = json.dumps(payload).encode('utf-8')
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode('utf-8'))

class TestLiveSystemEndpoints(unittest.TestCase):

    def test_01_health(self):
        h = req('/api/health')
        self.assertEqual(h.get('status'), 'ok')

    def test_02_spatial_layers(self):
        layers = req('/api/spatial/active_layers')
        self.assertTrue(layers.get('success'))
        self.assertGreaterEqual(len(layers.get('points', [])), 1)

    def test_03_spatial_clusters(self):
        clusters = req('/api/spatial/clusters', 'POST', {'eps_km': 10.0, 'min_samples': 3})
        self.assertTrue(clusters.get('success'))

    def test_04_investigation_init_and_chat(self):
        # Init
        inv_init = req('/api/investigation/init', 'POST', {
            'spatial_context': {'district_name': 'Bengaluru Urban', 'center_coordinates': [12.97, 77.59]},
            'hotspot_metadata': {'threat_level': 'CRITICAL', 'incident_count': 45, 'primary_crimes': [{'category': 'Robbery', 'percentage': 50}]},
            'sample_records': [{'id': 'FIR-901', 'title': 'Robbery near Indiranagar', 'date': '2026-08-29'}]
        })
        self.assertTrue(inv_init.get('success'))
        session_id = inv_init.get('session_id')
        self.assertTrue(session_id.startswith('inv_'))

        # Query suspects
        chat_sus = req('/api/investigation/chat', 'POST', {
            'session_id': session_id,
            'message': 'Who are the active repeat suspects operating in this district?'
        })
        self.assertTrue(chat_sus.get('success'))

        # Zoho Desk Ticket
        chat_ticket = req('/api/investigation/chat', 'POST', {
            'session_id': session_id,
            'message': 'Log a priority dispatch ticket in Zoho Desk for immediate tactical deployment.'
        })
        self.assertTrue(chat_ticket.get('success'))
        self.assertGreaterEqual(len(chat_ticket.get('tool_executions', [])), 1)

    def test_05_zoho_tickets_and_suspects(self):
        tickets = req('/api/investigation/tickets')
        self.assertTrue(tickets.get('success'))
        self.assertGreaterEqual(tickets.get('count', 0), 1)

        suspects = req('/api/investigation/suspects?district=Bengaluru')
        self.assertTrue(suspects.get('success'))
        self.assertGreaterEqual(suspects.get('count', 0), 1)

    def test_06_forensics_transcribe(self):
        forensics = req('/api/transcribe', 'POST', {'text': 'Suspect entered the warehouse at night.'})
        self.assertTrue(forensics.get('success'))

    def test_07_core_chat(self):
        chat_core = req('/chat', 'POST', {'query': 'Give me an overview of cyber crime trends.', 'session_id': 'test_core_session'})
        self.assertTrue(chat_core.get('success'))


if __name__ == '__main__':
    unittest.main()
