import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Loguly <noreply@loguly.app>";

export async function sendInvitationEmail({
  to,
  organizationName,
  inviteUrl,
  role,
}: {
  to: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}) {
  const roleName = role === "org_admin" ? "管理者" : "メンバー";

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${organizationName} への招待`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <h2 style="font-size: 20px; font-weight: bold; color: #1a1a2e;">Loguly への招待</h2>
        <p style="color: #555; line-height: 1.6;">
          <strong>${organizationName}</strong> に${roleName}として招待されました。
        </p>
        <p style="color: #555; line-height: 1.6;">
          以下のボタンをクリックしてアカウントを作成してください。
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}"
             style="display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            招待を受ける
          </a>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          この招待は7日間有効です。<br/>
          心当たりがない場合はこのメールを無視してください。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 11px;">Loguly - 動画視聴ログ管理システム</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send invitation email:", error);
    throw new Error("招待メールの送信に失敗しました");
  }
}
