/* دین و مذهب. هر فرد فیلد rel دارد: فهرستی به ترتیب زمان، از دین زادگاهی تا دین هنگام قدرت.
   مثال: rel: ['orthodox', 'shia12'] یعنی مسیحی ارتدوکس زاده شد و شیعه دوازده‌امامی شد.
   جزئیات (مکتب فقهی، طریقت، تردیدها) در فیلد متنی faith می‌آید. */
SH.religion(
  { id: 'sunni', name: 'مسلمان سنی', family: 'اسلام', color: '#2e8a52' },
  { id: 'shia12', name: 'مسلمان شیعه دوازده‌امامی', family: 'اسلام', color: '#1f6f8b' },
  { id: 'ghulat', name: 'مسلمان شیعه غالی (قزلباش)', family: 'اسلام', color: '#b0413e' },
  { id: 'zaydi', name: 'مسلمان شیعه زیدی', family: 'اسلام', color: '#4f7cac' },
  { id: 'ismaili', name: 'مسلمان شیعه اسماعیلی', family: 'اسلام', color: '#6a5acd' },
  { id: 'orthodox', name: 'مسیحی ارتدوکس', family: 'مسیحیت', color: '#9b4fb0' },
  { id: 'armenian', name: 'مسیحی ارمنی (گریگوری)', family: 'مسیحیت', color: '#c0682e' },
  { id: 'catholic', name: 'مسیحی کاتولیک', family: 'مسیحیت', color: '#b8861b' },
  { id: 'protestant', name: 'مسیحی پروتستان', family: 'مسیحیت', color: '#7a8b2a' },
  { id: 'jewish', name: 'یهودی', family: 'یهودیت', color: '#3a6fd0' },
  { id: 'zoroastrian', name: 'زرتشتی', family: 'زرتشتی', color: '#d99a00' },
  { id: 'babi', name: 'بابی', family: 'بابی و بهائی', color: '#8d6e63' },
  { id: 'bahai', name: 'بهائی', family: 'بابی و بهائی', color: '#a1887f' },
  { id: 'secular', name: 'بی‌دین / سکولار اعلام‌شده', family: 'بی‌دینی', color: '#78808a' },
  { id: 'unknown', name: 'نامعلوم / مورد اختلاف', family: 'نامعلوم', color: '#9e9e9e' }
);
