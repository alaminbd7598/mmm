/**
 * Plain-language explanation of why the server refused a staff change. The server answers with
 * English sentences (or a code); staff see a short localized reason instead of the raw text.
 */
export type Tr = (bn: string, en: string, ar: string) => string;

export function describeSyncRejection(reason: string | undefined, tr: Tr): string {
  const text = reason || '';
  if (text === 'TOO_LARGE' || /too large/i.test(text)) {
    return tr('ফাইল বা তথ্যের আকার খুব বড়।', 'The file or data is too large.', 'حجم الملف أو البيانات كبير جداً.');
  }
  if (text === 'RATE_LIMITED') {
    return tr(
      'অল্প সময়ে অনেকবার চেষ্টা করা হয়েছে; কিছুক্ষণ পর আবার চেষ্টা করুন।',
      'Too many attempts in a short time; please try again in a little while.',
      'محاولات كثيرة في وقت قصير؛ يرجى المحاولة بعد قليل.'
    );
  }
  if (/too common|known default/i.test(text)) {
    return tr(
      'এই পাসওয়ার্ডটি খুব সহজ বা বহুল ব্যবহৃত, তাই গ্রহণ করা হয়নি। অনুগ্রহ করে অন্য একটি পাসওয়ার্ড দিন।',
      'This password is too common, so it was not accepted. Please choose a different one.',
      'كلمة المرور هذه شائعة جداً فلم تُقبل. يرجى اختيار كلمة أخرى.'
    );
  }
  if (/^Password\b/i.test(text)) {
    return tr(
      'পাসওয়ার্ডটি নিয়ম অনুযায়ী হয়নি (যথেষ্ট দীর্ঘ, বর্ণ ও সংখ্যা দুটোই থাকতে হবে এবং ইউজার আইডি থাকা যাবে না)।',
      'The password does not meet the rules (long enough, letters and digits, and not containing the User ID).',
      'كلمة المرور لا تستوفي الشروط (طول كافٍ، أحرف وأرقام، ولا تحتوي على اسم المستخدم).'
    );
  }
  if (/username/i.test(text)) {
    return tr(
      'এই ইউজার আইডি ইতিমধ্যে ব্যবহৃত হচ্ছে অথবা সঠিক নয়।',
      'This User ID is already in use or not valid.',
      'اسم المستخدم هذا مستخدم بالفعل أو غير صالح.'
    );
  }
  if (/^Your role cannot|Only Super Admins|You cannot|Super Admin/i.test(text)) {
    return tr(
      'এই পরিবর্তনটি করার অনুমতি আপনার অ্যাকাউন্টের নেই।',
      'Your account is not allowed to make this change.',
      'حسابك لا يملك صلاحية إجراء هذا التغيير.'
    );
  }
  if (/link|url|scheme|image|iframe|embed/i.test(text)) {
    return tr(
      'কোনো লিংক, ছবি বা এমবেড কোড গ্রহণযোগ্য নয়।',
      'A link, image or embed code is not acceptable.',
      'يوجد رابط أو صورة أو رمز تضمين غير مقبول.'
    );
  }
  return text
    ? tr('কিছু তথ্য সঠিক নয়।', 'Some of the data is not valid.', 'بعض البيانات غير صالحة.')
    : '';
}
