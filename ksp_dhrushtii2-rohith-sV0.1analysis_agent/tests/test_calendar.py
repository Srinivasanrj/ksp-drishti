"""
Unit and API tests for Calendar blueprint and repository.
"""
import unittest
from app.blueprints.calendar import InMemoryCalendarRepository
from server import app


class TestCalendar(unittest.TestCase):
    def setUp(self):
        self.repo = InMemoryCalendarRepository()
        self.client = app.test_client()

    def test_repo_crud(self):
        # 1. Get initial baseline events
        events = self.repo.get_events()
        self.assertGreaterEqual(len(events), 3)

        # 2. Add event
        new_event = self.repo.add_event({
            "title": "Tactical Briefing at Hubballi",
            "division": "Hubballi-Dharwad",
            "priority": "HIGH",
            "officer_badge": "KSP-HUB-9901"
        })
        self.assertTrue(new_event["id"].startswith("EVT-KSP-"))

        # 3. Filter by division
        hub_events = self.repo.get_events(division="Hubballi-Dharwad")
        self.assertEqual(len(hub_events), 1)
        self.assertEqual(hub_events[0]["title"], "Tactical Briefing at Hubballi")

        # 4. Delete event
        deleted = self.repo.delete_event(new_event["id"])
        self.assertTrue(deleted)

    def test_api_endpoints(self):
        # GET /api/calendar/divisions
        res = self.client.get("/api/calendar/divisions")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("Bengaluru City", data["divisions"])

        # GET /api/calendar/events
        res = self.client.get("/api/calendar/events")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 1)

        # POST /api/calendar/events
        payload = {
            "title": "VIP Escort & Sector Patrol",
            "division": "Mysuru City",
            "priority": "MEDIUM",
            "officer_badge": "KSP-MYS-3312"
        }
        res = self.client.post("/api/calendar/events", json=payload)
        self.assertEqual(res.status_code, 201)
        created_evt = res.get_json()["event"]
        evt_id = created_evt["id"]

        # DELETE /api/calendar/events/<id>
        res = self.client.delete(f"/api/calendar/events/{evt_id}")
        self.assertEqual(res.status_code, 200)

        # GET /api/calendar/summary
        res = self.client.get("/api/calendar/summary")
        self.assertEqual(res.status_code, 200)
        summary = res.get_json()
        self.assertTrue(summary["success"])
        self.assertIn("total_events", summary)


if __name__ == "__main__":
    unittest.main()
