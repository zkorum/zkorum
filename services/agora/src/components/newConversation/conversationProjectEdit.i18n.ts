import type { SupportedDisplayLanguageCodes } from "src/shared/languages";

export interface ConversationProjectEditTranslations {
  projectUnavailableError: string;
  projectPermissionError: string;
  projectChangedError: string;
  detachLanguagesError: string;
}

export const conversationProjectEditTranslations: Record<
  SupportedDisplayLanguageCodes,
  ConversationProjectEditTranslations
> = {
  en: {
    projectUnavailableError:
      "This project is no longer available. Choose another project.",
    projectPermissionError:
      "You need permission to create and edit conversations in the destination project.",
    projectChangedError:
      "Another facilitator moved this conversation. Reopen the editor to load its current project.",
    detachLanguagesError:
      "Before choosing No project, switch to custom languages and choose up to two additional languages.",
  },
  fr: {
    projectUnavailableError:
      "Ce projet n’est plus disponible. Choisissez un autre projet.",
    projectPermissionError:
      "Vous devez pouvoir créer et modifier des conversations dans le projet de destination.",
    projectChangedError:
      "Un autre facilitateur a déplacé cette conversation. Rouvrez l’éditeur pour charger son projet actuel.",
    detachLanguagesError:
      "Avant de choisir Aucun projet, personnalisez les langues et choisissez au maximum deux langues supplémentaires.",
  },
  es: {
    projectUnavailableError:
      "Este proyecto ya no está disponible. Elija otro proyecto.",
    projectPermissionError:
      "Necesita permiso para crear y editar conversaciones en el proyecto de destino.",
    projectChangedError:
      "Otro facilitador movió esta conversación. Vuelva a abrir el editor para cargar su proyecto actual.",
    detachLanguagesError:
      "Antes de elegir Sin proyecto, personalice los idiomas y elija hasta dos idiomas adicionales.",
  },
  "zh-Hans": {
    projectUnavailableError: "此项目已不可用。请选择其他项目。",
    projectPermissionError: "您需要在目标项目中创建和编辑对话的权限。",
    projectChangedError:
      "其他主持人已移动此对话。请重新打开编辑器以加载当前项目。",
    detachLanguagesError:
      "选择无项目前，请切换到自定义语言，并选择最多两种附加语言。",
  },
  "zh-Hant": {
    projectUnavailableError: "此專案已無法使用。請選擇其他專案。",
    projectPermissionError: "您需要在目標專案中建立和編輯對話的權限。",
    projectChangedError:
      "其他主持人已移動此對話。請重新開啟編輯器以載入目前專案。",
    detachLanguagesError:
      "選擇無專案前，請切換至自訂語言，並選擇最多兩種附加語言。",
  },
  ja: {
    projectUnavailableError:
      "このプロジェクトは利用できません。別のプロジェクトを選択してください。",
    projectPermissionError:
      "移動先のプロジェクトで会話を作成・編集する権限が必要です。",
    projectChangedError:
      "別の進行役がこの会話を移動しました。編集画面を開き直して現在のプロジェクトを読み込んでください。",
    detachLanguagesError:
      "プロジェクトなしを選ぶ前に言語をカスタマイズし、追加言語を最大2つ選択してください。",
  },
  ar: {
    projectUnavailableError: "لم يعد هذا المشروع متاحًا. اختر مشروعًا آخر.",
    projectPermissionError:
      "تحتاج إلى إذن لإنشاء المحادثات وتعديلها في المشروع الوجهة.",
    projectChangedError:
      "نقل ميسّر آخر هذه المحادثة. أعد فتح المحرر لتحميل مشروعها الحالي.",
    detachLanguagesError:
      "قبل اختيار بدون مشروع، خصّص اللغات واختر لغتين إضافيتين كحد أقصى.",
  },
  fa: {
    projectUnavailableError:
      "این پروژه دیگر در دسترس نیست. پروژه دیگری انتخاب کنید.",
    projectPermissionError:
      "برای ایجاد و ویرایش گفتگو در پروژه مقصد به مجوز نیاز دارید.",
    projectChangedError:
      "تسهیل‌گر دیگری این گفتگو را جابه‌جا کرده است. ویرایشگر را دوباره باز کنید تا پروژه فعلی بارگیری شود.",
    detachLanguagesError:
      "پیش از انتخاب بدون پروژه، زبان‌ها را سفارشی کنید و حداکثر دو زبان اضافی انتخاب کنید.",
  },
  he: {
    projectUnavailableError: "הפרויקט הזה אינו זמין עוד. בחרו פרויקט אחר.",
    projectPermissionError: "נדרשת הרשאה ליצור ולערוך שיחות בפרויקט היעד.",
    projectChangedError:
      "מנחה אחר העביר את השיחה. פתחו מחדש את העורך כדי לטעון את הפרויקט הנוכחי.",
    detachLanguagesError:
      "לפני בחירה ללא פרויקט, התאימו את השפות ובחרו עד שתי שפות נוספות.",
  },
  ky: {
    projectUnavailableError:
      "Бул долбоор мындан ары жеткиликтүү эмес. Башка долбоорду тандаңыз.",
    projectPermissionError:
      "Көздөгөн долбоордо талкууларды түзүүгө жана түзөтүүгө уруксат керек.",
    projectChangedError:
      "Башка алып баруучу бул талкууну көчүрдү. Учурдагы долбоорду жүктөө үчүн түзөткүчтү кайра ачыңыз.",
    detachLanguagesError:
      "Долбоор жок дегенди тандоодон мурун тилдерди ыңгайлаштырып, экиден ашпаган кошумча тилди тандаңыз.",
  },
  ru: {
    projectUnavailableError:
      "Этот проект больше недоступен. Выберите другой проект.",
    projectPermissionError:
      "Вам нужны права на создание и редактирование обсуждений в целевом проекте.",
    projectChangedError:
      "Другой ведущий переместил это обсуждение. Откройте редактор заново, чтобы загрузить текущий проект.",
    detachLanguagesError:
      "Прежде чем выбрать Без проекта, настройте языки и выберите не более двух дополнительных языков.",
  },
};
