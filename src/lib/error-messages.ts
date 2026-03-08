/**
 * Supabaseなどから返る英語エラーメッセージを日本語に変換する
 */

const errorMap: [RegExp, string][] = [
  [/Invalid login credentials/i, "メールアドレスまたはパスワードが正しくありません"],
  [/already been registered/i, "このメールアドレスは既に登録されています"],
  [/User already registered/i, "このメールアドレスは既に登録されています"],
  [/already registered/i, "既に登録済みです"],
  [/Email not confirmed/i, "メールアドレスが確認されていません"],
  [/rate limit/i, "リクエスト回数の上限に達しました。しばらく待ってから再度お試しください"],
  [/row-level security/i, "権限がありません"],
  [/duplicate key/i, "既に登録済みのデータです"],
  [/not found/i, "データが見つかりません"],
  [/permission denied/i, "権限がありません"],
  [/foreign key violation/i, "関連するデータが存在するため操作できません"],
  [/Password should be at least/i, "パスワードは6文字以上で入力してください"],
  [/Unable to validate email/i, "有効なメールアドレスを入力してください"],
];

export function toJapaneseError(message: string): string {
  for (const [pattern, japanese] of errorMap) {
    if (pattern.test(message)) {
      return japanese;
    }
  }
  return "エラーが発生しました";
}
