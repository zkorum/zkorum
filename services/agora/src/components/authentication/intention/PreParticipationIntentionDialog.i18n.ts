import type { SupportedDisplayLanguageCodes } from "src/shared/languages";

export interface PreParticipationIntentionDialogTranslations {
  title: string;
  message: string;
  labelOk: string;
  labelCancel: string;
  subMessageStatementDraft: string;
  subMessageConversationDraft: string;
  subMessageReturnToStatement: string;
  subMessageReturnToConversation: string;
  subMessageReportRequired: string;
}

export const preParticipationIntentionDialogTranslations: Record<
  SupportedDisplayLanguageCodes,
  PreParticipationIntentionDialogTranslations
> = {
  en: {
    title: "Log in to Agora",
    message: "Log in to participate in the discussions",
    labelOk: "Log In",
    labelCancel: "Cancel",
    subMessageStatementDraft: "Your statement draft will be saved.",
    subMessageConversationDraft: "Your conversation draft will be saved.",
    subMessageReturnToStatement:
      "Then you’ll return to this statement to cast your vote.",
    subMessageReturnToConversation:
      "Then you’ll return to this conversation to vote.",
    subMessageReportRequired:
      "A user account is required to report user content.",
  },
  fa: {
    title: "ورود به Agora",
    message: "برای مشارکت در بحث‌ها وارد شوید",
    labelOk: "ورود",
    labelCancel: "لغو",
    subMessageStatementDraft: "پیش‌نویس گزاره شما ذخیره خواهد شد.",
    subMessageConversationDraft: "پیش‌نویس گفتگوی شما ذخیره خواهد شد.",
    subMessageReturnToStatement: "شما به این گزاره بازگردانده خواهید شد.",
    subMessageReturnToConversation: "شما به این گفتگو بازگردانده خواهید شد.",
    subMessageReportRequired: "برای گزارش محتوای کاربر، حساب کاربری لازم است.",
  },
  ar: {
    title: "تسجيل الدخول إلى أغورا",
    message: "سجّل دخولك للمشاركة في النقاشات",
    labelOk: "تسجيل الدخول",
    labelCancel: "إلغاء",
    subMessageStatementDraft: "سيتم حفظ مسودة الاقتراح الخاص بك.",
    subMessageConversationDraft: "سيتم حفظ مسودة المحادثة الخاصة بك.",
    subMessageReturnToStatement: "ستتم إعادتك إلى هذا الاقتراح.",
    subMessageReturnToConversation: "ستتم إعادتك إلى هذه المحادثة.",
    subMessageReportRequired: "يلزم حساب مستخدم للإبلاغ عن محتوى المستخدم.",
  },
  es: {
    title: "Iniciar sesión en Ágora",
    message: "Inicie sesión para participar en las discusiones",
    labelOk: "Iniciar Sesión",
    labelCancel: "Cancelar",
    subMessageStatementDraft: "Su borrador de proposición se guardará.",
    subMessageConversationDraft: "Su borrador de conversación se guardará.",
    subMessageReturnToStatement: "Volverá a esta proposición.",
    subMessageReturnToConversation: "Volverá a esta conversación.",
    subMessageReportRequired:
      "Se requiere una cuenta de usuario para reportar contenido.",
  },
  fr: {
    title: "Se connecter à Agora",
    message: "Connectez-vous pour participer aux discussions",
    labelOk: "Se Connecter",
    labelCancel: "Annuler",
    subMessageStatementDraft: "Votre brouillon de proposition sera sauvegardé.",
    subMessageConversationDraft:
      "Votre brouillon de conversation sera sauvegardé.",
    subMessageReturnToStatement:
      "Vous retrouverez ensuite cette proposition pour voter.",
    subMessageReturnToConversation:
      "Vous retrouverez ensuite cette conversation pour voter.",
    subMessageReportRequired:
      "Un compte utilisateur est nécessaire pour signaler du contenu.",
  },
  "zh-Hans": {
    title: "登录 Agora",
    message: "登录以参与讨论",
    labelOk: "登录",
    labelCancel: "取消",
    subMessageStatementDraft: "您的意见草稿将被保存。",
    subMessageConversationDraft: "您的对话草稿将被保存。",
    subMessageReturnToStatement: "您将返回到该意见。",
    subMessageReturnToConversation: "您将返回到该对话。",
    subMessageReportRequired: "举报用户内容需要用户账户。",
  },
  "zh-Hant": {
    title: "登入 Agora",
    message: "登入以參與討論",
    labelOk: "登入",
    labelCancel: "取消",
    subMessageStatementDraft: "您的意見草稿將被儲存。",
    subMessageConversationDraft: "您的對話草稿將被儲存。",
    subMessageReturnToStatement: "您將返回到該意見。",
    subMessageReturnToConversation: "您將返回到該對話。",
    subMessageReportRequired: "檢舉用戶內容需要用戶帳戶。",
  },
  he: {
    title: "התחברות ל-Agora",
    message: "התחברו כדי להשתתף בדיונים",
    labelOk: "התחברות",
    labelCancel: "ביטול",
    subMessageStatementDraft: "טיוטת ההצהרה שלך תישמר.",
    subMessageConversationDraft: "טיוטת השיחה שלך תישמר.",
    subMessageReturnToStatement: "תוחזרו להצהרה זו.",
    subMessageReturnToConversation: "תוחזרו לשיחה זו.",
    subMessageReportRequired: "נדרש חשבון משתמש לדיווח על תוכן משתמשים.",
  },
  ja: {
    title: "Agora にログイン",
    message: "ログインして議論に参加",
    labelOk: "ログイン",
    labelCancel: "キャンセル",
    subMessageStatementDraft: "あなたの意見の下書きは保存されます。",
    subMessageConversationDraft: "あなたの会話の下書きは保存されます。",
    subMessageReturnToStatement: "この意見に戻ります。",
    subMessageReturnToConversation: "この会話に戻ります。",
    subMessageReportRequired:
      "コンテンツの報告にはユーザーアカウントが必要です。",
  },
  ky: {
    title: "Agora'га кирүү",
    message: "Талкууларга катышуу үчүн кириңиз",
    labelOk: "Кирүү",
    labelCancel: "Жокко чыгаруу",
    subMessageStatementDraft: "Пикириңиздин черновиги сакталат.",
    subMessageConversationDraft: "Талкуу черновигиңиз сакталат.",
    subMessageReturnToStatement: "Сиз бул пикирге кайтарыласыз.",
    subMessageReturnToConversation: "Сиз бул талкууга кайтарыласыз.",
    subMessageReportRequired:
      "Мазмун жөнүндө кабарлоо үчүн колдонуучу аккаунту талап кылынат.",
  },
  ru: {
    title: "Войти в Agora",
    message: "Войдите, чтобы участвовать в обсуждениях",
    labelOk: "Войти",
    labelCancel: "Отмена",
    subMessageStatementDraft: "Черновик вашего высказывания будет сохранён.",
    subMessageConversationDraft: "Черновик вашего обсуждения будет сохранён.",
    subMessageReturnToStatement: "Вы вернётесь к этому высказыванию.",
    subMessageReturnToConversation: "Вы вернётесь к этому обсуждению.",
    subMessageReportRequired:
      "Для отправки жалобы на контент требуется учётная запись.",
  },
};
