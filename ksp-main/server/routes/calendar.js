/**
 * Calendar & Event Intelligence REST Routes
 * API Endpoint: /api/calendar/*
 */

import express from 'express';
import calendarService from '../services/calendarService.js';

const router = express.Router();

// ── 1. GET /api/calendar/events (List division-scoped events) ────────────────
router.get('/events', async (req, res) => {
  try {
    const division = req.query.division || 'Bengaluru';
    const filters = {
      eventType: req.query.eventType,
      scope: req.query.scope,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const events = await calendarService.getEventsForDivision(division, filters);
    res.json({
      success: true,
      division,
      count: events.length,
      events
    });
  } catch (err) {
    console.error('[CalendarRouter] GET /events error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 2. GET /api/calendar/events/upcoming (Upcoming events for division) ───────
router.get('/events/upcoming', async (req, res) => {
  try {
    const division = req.query.division || 'Bengaluru';
    const daysAhead = parseInt(req.query.days, 10) || 30;

    const events = await calendarService.getUpcomingEvents(division, daysAhead);
    res.json({
      success: true,
      division,
      daysAhead,
      count: events.length,
      events
    });
  } catch (err) {
    console.error('[CalendarRouter] GET /events/upcoming error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. GET /api/calendar/reminders (Active 2-day event reminders) ──────────────
router.get('/reminders', async (req, res) => {
  try {
    const division = req.query.division || 'Bengaluru';
    const reminders = await calendarService.getUpcomingReminders(division);
    res.json({
      success: true,
      division,
      count: reminders.length,
      reminders
    });
  } catch (err) {
    console.error('[CalendarRouter] GET /reminders error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 4. GET /api/calendar/advisory (Combined Calendar + Crime Advisory) ────────
router.get('/advisory', async (req, res) => {
  try {
    const division = req.query.division || 'Bengaluru';
    const query = req.query.query || req.query.event || '';

    const advisory = await calendarService.generateOperationalAdvisory(query, division);
    res.json({
      success: true,
      division,
      advisory
    });
  } catch (err) {
    console.error('[CalendarRouter] GET /advisory error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 5. GET /api/calendar/events/:id (Get single event by ID) ──────────────────
router.get('/events/:id', async (req, res) => {
  try {
    const division = req.query.division || 'Bengaluru';
    const event = await calendarService.getEventById(req.params.id, division);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found or unauthorized for this division.'
      });
    }

    res.json({ success: true, event });
  } catch (err) {
    console.error('[CalendarRouter] GET /events/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 6. POST /api/calendar/events (Create operational police event) ────────────
router.post('/events', async (req, res) => {
  try {
    const userDivision = req.body.Division || req.body.division || req.query.division || req.query.Division || 'Bengaluru';
    const userRole = req.body.Role || req.body.role || req.query.role || 'OFFICER';

    const result = await calendarService.createEvent(req.body, userDivision, userRole);
    res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    console.error('[CalendarRouter] POST /events error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 7. PUT /api/calendar/events/:id (Update operational police event) ──────────
router.put('/events/:id', async (req, res) => {
  try {
    const userDivision = req.body.Division || req.body.division || req.query.division || req.query.Division || 'Bengaluru';
    const userRole = req.body.Role || req.body.role || req.query.role || 'OFFICER';

    const result = await calendarService.updateEvent(req.params.id, req.body, userDivision, userRole);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error('[CalendarRouter] PUT /events/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 8. DELETE /api/calendar/events/:id (Delete/deactivate police event) ────────
router.delete('/events/:id', async (req, res) => {
  try {
    const userDivision = req.query.division || req.query.Division || req.body.Division || req.body.division || 'Bengaluru';
    const userRole = req.query.role || req.body.role || 'OFFICER';

    const result = await calendarService.deleteEvent(req.params.id, userDivision, userRole);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error('[CalendarRouter] DELETE /events/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 9. GET /api/calendar/divisions (List dynamic division hierarchy) ────────
router.get('/divisions', (req, res) => {
  try {
    const hierarchy = calendarService.getDivisionHierarchy();
    res.json({
      success: true,
      divisions: Object.keys(hierarchy),
      hierarchy
    });
  } catch (err) {
    console.error('[CalendarRouter] GET /divisions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
