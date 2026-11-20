import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VIRTUAL_OFFICE_CONFIG,
  computeVirtualOfficeAnalytics,
  evaluateVirtualOfficeLiveStatus,
  resolveDeskJoinDetails,
  sanitizeVirtualOfficeForPublic,
  virtualOfficeCheckinSchema,
} from './virtualOfficeLogic';

describe('Virtual Office Hybrid Live Desk Security & Logic', () => {
  it('sanitizeVirtualOfficeForPublic strictly strips roomUrl, zoomMeetingId, and zoomPasscode', () => {
    const publicPayload = sanitizeVirtualOfficeForPublic(DEFAULT_VIRTUAL_OFFICE_CONFIG);
    const serialized = JSON.stringify(publicPayload);

    assert.equal(serialized.includes('meet.google.com'), false);
    assert.equal(serialized.includes('zoom.us'), false);
    assert.equal(serialized.includes('MMM2027'), false);
    assert.equal(serialized.includes('880 1886 3403'), false);
    assert.equal(publicPayload.desks.length, 3);
    assert.equal('roomUrl' in publicPayload, false);
    assert.equal('roomUrl' in publicPayload.desks[0], false);
  });

  it('virtualOfficeCheckinSchema enforces mandatory Full Name, valid Phone, and valid Email', () => {
    const missingFields = virtualOfficeCheckinSchema.safeParse({
      fullName: 'A',
      phone: '123',
      email: 'not-an-email',
    });
    assert.equal(missingFields.success, false);

    const validSubmission = virtualOfficeCheckinSchema.safeParse({
      fullName: 'মো. আব্দুল্লাহ আল মামুন',
      phone: '01711-223344',
      email: 'guardian@example.com',
      deskId: 'desk-admission',
    });
    assert.equal(validSubmission.success, true);
  });

  it('evaluateVirtualOfficeLiveStatus respects manual override and disabled flag', () => {
    assert.equal(
      evaluateVirtualOfficeLiveStatus({ ...DEFAULT_VIRTUAL_OFFICE_CONFIG, enabled: false }),
      'OFFLINE'
    );
    assert.equal(
      evaluateVirtualOfficeLiveStatus({
        ...DEFAULT_VIRTUAL_OFFICE_CONFIG,
        manualStatus: 'ONLINE_LIVE',
      }),
      'ONLINE_LIVE'
    );
    assert.equal(
      evaluateVirtualOfficeLiveStatus({
        ...DEFAULT_VIRTUAL_OFFICE_CONFIG,
        manualStatus: 'BUSY_IN_SESSION',
      }),
      'BUSY_IN_SESSION'
    );
    assert.equal(
      evaluateVirtualOfficeLiveStatus({
        ...DEFAULT_VIRTUAL_OFFICE_CONFIG,
        manualStatus: 'OFFLINE',
      }),
      'OFFLINE'
    );
  });

  it('resolveDeskJoinDetails returns server-side meeting room only after check-in', () => {
    const details = resolveDeskJoinDetails(DEFAULT_VIRTUAL_OFFICE_CONFIG, 'desk-principal');
    assert.equal(details.platform, 'Zoom');
    assert.equal(details.roomUrl, 'https://zoom.us/j/88018863403');
    assert.equal(details.zoomPasscode, 'MMM2027');
  });

  it('computeVirtualOfficeAnalytics aggregates conversion rate and hourly buckets accurately', () => {
    const analytics = computeVirtualOfficeAnalytics([
      {
        id: 'vo-1',
        fullName: 'Test 1',
        phone: '01711000001',
        email: 'a@b.com',
        deskId: 'desk-admission',
        deskNameBn: 'ডেস্ক',
        platform: 'Google Meet',
        deskMode: 'ONLINE_LIVE',
        checkedInAt: '2026-11-20T09:30:00Z',
        sessionStatus: 'Enrolled',
      },
      {
        id: 'vo-2',
        fullName: 'Test 2',
        phone: '01711000002',
        email: 'b@b.com',
        deskId: 'desk-fees',
        deskNameBn: 'ডেস্ক',
        platform: 'Google Meet',
        deskMode: 'ONLINE_LIVE',
        checkedInAt: '2026-11-20T15:15:00Z',
        sessionStatus: 'Counseled',
      },
    ]);
    assert.equal(analytics.totalVisits, 2);
    assert.equal(analytics.enrolledCount, 1);
    assert.equal(analytics.counseledCount, 2);
    assert.equal(analytics.conversionRate, 50);
    assert.equal(analytics.peakHoursData.length, 6);
  });
});
