import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterHomeFaqByCategory,
  HOME_FAQ_ITEMS,
  validateQuickHomeRegistration,
} from './homeConversionLogic';

test('filterHomeFaqByCategory returns matching Maharat Model Madrasah FAQs for all 5 tabs', () => {
  const categories = ['admission', 'academic', 'residence', 'fees', 'others'] as const;
  for (const cat of categories) {
    const items = filterHomeFaqByCategory(HOME_FAQ_ITEMS, cat);
    assert.ok(items.length >= 2, `Category ${cat} should contain at least 2 FAQs`);
    assert.ok(items.every((item) => item.category === cat));
  }
});

test('validateQuickHomeRegistration syncs WhatsApp when sameAsMobile is true', () => {
  const res = validateQuickHomeRegistration(
    {
      studentName: 'আহমাদ হাসান',
      guardianName: 'মোঃ রফিকুল ইসলাম',
      mobile: '01886-340308',
      whatsapp: '',
      sameAsMobile: true,
      department: 'General',
      targetClass: '৩য় শ্রেণি',
      accommodation: 'Non-Residential',
      address: 'সেক্টর-১২, উত্তরা',
    },
    'bn'
  );
  assert.equal(res.valid, true);
  assert.equal(res.resolvedWhatsapp, '01886-340308');
});

test('validateQuickHomeRegistration rejects invalid phone and missing class', () => {
  const badPhone = validateQuickHomeRegistration(
    {
      studentName: 'তাওসিফ',
      guardianName: 'ইমরান হোসেন',
      mobile: '01886',
      whatsapp: '',
      sameAsMobile: true,
      department: 'Tahfiz',
      targetClass: 'নূরানী বিভাগ',
      accommodation: 'Day-Care',
      address: '',
    },
    'bn'
  );
  assert.equal(badPhone.valid, false);
  assert.ok(badPhone.error);

  const missingClass = validateQuickHomeRegistration(
    {
      studentName: 'Tawsif',
      guardianName: 'Imran',
      mobile: '01886340308',
      whatsapp: '01901631641',
      sameAsMobile: false,
      department: 'General',
      targetClass: '',
      accommodation: 'Residential',
      address: '',
    },
    'en'
  );
  assert.equal(missingClass.valid, false);
  assert.equal(missingClass.resolvedWhatsapp, '01901631641');
});
