window.ELECTION_CONFIG = {
  schoolName: 'Leader School',
  totalVoters: 423,
opensAt: '2026-09-17T09:00:00+05:00',
closesAt: '2026-09-18T09:00:00+05:00',
  timeZone: 'Asia/Tashkent',
  formUrl: 'https://forms.gle/E8LXjWM4ZaHcdfBH9',
  // ЯВКА: после проверки меняйте только эти две строки. Процент считается сам.
  manualVotes: 0,
  // Время вашей последней проверки по Ташкенту. Пример: '2026-09-14T13:00:00+05:00'.
  // До первой проверки оставьте пустые кавычки.
  manualUpdatedAt: '',
  // Можно добавить ссылку на утверждённую редакцию Положения (PDF).
  regulationsUrl: '',
  // Например: label: 'Комиссия по выборам', url: 'https://t.me/имя'
  contact: { label: '', url: '' },
  // Опубликуйте всех кандидатов одновременно после регистрации комиссией.
  // Фото положите в dist/assets/candidates/ и укажите 'assets/candidates/name.jpg'.
  // registered: true — кандидат зарегистрирован; false — место ещё не заполнено.
  candidates: [
    { id: 'grade8', grade: '8', name: 'Ниязметов Амир', className:'8 Fortius', photo: '', tagline: '', bio: '', ideas: [], registered: true },
    { id: 'grade9', grade: '9', name: 'Махаматшаева Шахинамалакбегим', className: '9 Fusion', photo: '', tagline: '', bio: '', ideas: [], registered: true },
    { id: 'grade10', grade: '9', name: 'Пулатов Анвар', className: '9 Fusion', photo: '', tagline: '', bio: '', ideas: [], registered: true },
    { id: 'grade10', grade: '10', name: 'Касимов Рауф', className: '10', photo: '', tagline: '', bio: '', ideas: [], registered: true },
    { id: 'grade10', grade: '10', name: 'Рашидов Амир', className: '10', photo: '', tagline: '', bio: '', ideas: [], registered: true },
  ]
};
