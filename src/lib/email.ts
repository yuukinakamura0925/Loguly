import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "noreply@resend.dev";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export async function sendInvitationEmail(
  to: string,
  inviteUrl: string,
  orgName: string,
) {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: `Loguly <${FROM_ADDRESS}>`,
    to,
    subject: `【Loguly】${orgName} への招待`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a; margin-bottom: 16px;">${orgName} に招待されました</h2>
        <p style="color: #555; line-height: 1.6;">
          以下のリンクからアカウントを作成して参加してください。<br />
          リンクの有効期限は <strong>7日間</strong> です。
        </p>
        <div style="margin: 32px 0;">
          <a
            href="${inviteUrl}"
            style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;"
          >
            招待を受ける
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">
          このメールに心当たりがない場合は無視してください。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px;">Loguly - 動画視聴ログ管理システム</p>
      </div>
    `,
  });

  return { error: error ? error.message : null };
}
