import type { SupportedDisplayLanguageCodes } from "src/shared/languages";

interface Texts {
  existingTitle: string;
  newTitle: string;
  readOnlyDescription: string;
  emptyExisting: string;
  sourceManaged: string;
}

export const editSeedOpinionsTranslations: Record<
  SupportedDisplayLanguageCodes,
  Texts
> = {
  en: {
    existingTitle: "Existing seed statements",
    newTitle: "Add new statements",
    readOnlyDescription:
      "Published statements cannot be changed here. You can add new statements below.",
    emptyExisting: "No seed statements yet.",
    sourceManaged:
      "These statements are synced from GitHub. Manage them on GitHub.",
  },
  fr: {
    existingTitle: "Propositions initiales existantes",
    newTitle: "Ajouter de nouvelles propositions",
    readOnlyDescription:
      "Les propositions publiées ne peuvent pas être modifiées ici. Vous pouvez en ajouter ci-dessous.",
    emptyExisting: "Aucune proposition initiale pour le moment.",
    sourceManaged:
      "Ces propositions sont synchronisées depuis GitHub. Gérez-les sur GitHub.",
  },
  es: {
    existingTitle: "Proposiciones iniciales existentes",
    newTitle: "Añadir nuevas proposiciones",
    readOnlyDescription:
      "Las proposiciones publicadas no se pueden cambiar aquí. Puede añadir nuevas proposiciones abajo.",
    emptyExisting: "Todavía no hay proposiciones iniciales.",
    sourceManaged:
      "Estas proposiciones se sincronizan desde GitHub. Gestiónelas en GitHub.",
  },
  ar: {
    existingTitle: "المقترحات الأولية الحالية",
    newTitle: "إضافة مقترحات جديدة",
    readOnlyDescription:
      "لا يمكن تعديل المقترحات المنشورة هنا. يمكنك إضافة مقترحات جديدة أدناه.",
    emptyExisting: "لا توجد مقترحات أولية بعد.",
    sourceManaged: "تتم مزامنة هذه المقترحات من GitHub. أدرها على GitHub.",
  },
  fa: {
    existingTitle: "گزاره‌های اولیه موجود",
    newTitle: "افزودن گزاره‌های جدید",
    readOnlyDescription:
      "گزاره‌های منتشرشده در اینجا قابل تغییر نیستند. می‌توانید گزاره‌های جدیدی در پایین اضافه کنید.",
    emptyExisting: "هنوز گزاره اولیه‌ای وجود ندارد.",
    sourceManaged:
      "این گزاره‌ها از GitHub همگام‌سازی می‌شوند. آن‌ها را در GitHub مدیریت کنید.",
  },
  he: {
    existingTitle: "הצהרות ראשוניות קיימות",
    newTitle: "הוספת הצהרות חדשות",
    readOnlyDescription:
      "לא ניתן לשנות כאן הצהרות שפורסמו. ניתן להוסיף הצהרות חדשות למטה.",
    emptyExisting: "עדיין אין הצהרות ראשוניות.",
    sourceManaged: "הצהרות אלה מסונכרנות מ־GitHub. יש לנהל אותן ב־GitHub.",
  },
  "zh-Hans": {
    existingTitle: "现有初始陈述",
    newTitle: "添加新陈述",
    readOnlyDescription: "已发布的陈述无法在此更改。您可以在下方添加新陈述。",
    emptyExisting: "暂无初始陈述。",
    sourceManaged: "这些陈述从 GitHub 同步。请在 GitHub 上管理。",
  },
  "zh-Hant": {
    existingTitle: "現有初始陳述",
    newTitle: "新增陳述",
    readOnlyDescription: "已發布的陳述無法在此變更。您可以在下方新增陳述。",
    emptyExisting: "尚無初始陳述。",
    sourceManaged: "這些陳述從 GitHub 同步。請在 GitHub 上管理。",
  },
  ja: {
    existingTitle: "既存の初期意見",
    newTitle: "新しい意見を追加",
    readOnlyDescription:
      "公開済みの意見はここでは変更できません。下に新しい意見を追加できます。",
    emptyExisting: "初期意見はまだありません。",
    sourceManaged:
      "これらの意見は GitHub から同期されます。GitHub で管理してください。",
  },
  ky: {
    existingTitle: "Учурдагы баштапкы пикирлер",
    newTitle: "Жаңы пикирлерди кошуу",
    readOnlyDescription:
      "Жарыяланган пикирлерди бул жерден өзгөртүү мүмкүн эмес. Төмөндө жаңы пикирлерди кошо аласыз.",
    emptyExisting: "Баштапкы пикирлер азырынча жок.",
    sourceManaged:
      "Бул пикирлер GitHub менен шайкештештирилет. Аларды GitHub аркылуу башкарыңыз.",
  },
  ru: {
    existingTitle: "Существующие начальные высказывания",
    newTitle: "Добавить новые высказывания",
    readOnlyDescription:
      "Опубликованные высказывания нельзя изменить здесь. Ниже можно добавить новые.",
    emptyExisting: "Начальных высказываний пока нет.",
    sourceManaged:
      "Эти высказывания синхронизируются с GitHub. Управляйте ими на GitHub.",
  },
};
