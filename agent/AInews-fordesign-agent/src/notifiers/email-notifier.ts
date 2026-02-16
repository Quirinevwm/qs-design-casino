import nodemailer from 'nodemailer';
import type { AnalysisResult } from '../ai/types.js';

export class EmailNotifier {
  private transporter: nodemailer.Transporter;
  private toEmail: string;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.EMAIL_TO;

    if (!smtpUser || !smtpPass || !toEmail) {
      throw new Error('Email configuration not set. Set SMTP_USER, SMTP_PASS, and EMAIL_TO environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.toEmail = toEmail;
  }

  async send(analysis: AnalysisResult): Promise<void> {
    if (analysis.insights.length === 0) {
      console.log('No insights to send');
      return;
    }

    const html = this.buildEmailHTML(analysis);
    const text = this.buildEmailText(analysis);

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: this.toEmail,
        subject: `🤖 AI News Digest: ${analysis.analyzedAt.toLocaleDateString()}`,
        text: text,
        html: html,
      });

      console.log(`Sent digest with ${analysis.insights.length} insights to ${this.toEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildEmailHTML(analysis: AnalysisResult): string {
    const insightsHTML = analysis.insights.map((insight, idx) => `
      <div style="margin-bottom: 30px; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #0078d4;">
        <h2 style="margin: 0 0 10px 0; color: #0078d4;">${idx + 1}. ${insight.title}</h2>
        <p style="color: #666; margin: 0 0 5px 0; font-size: 12px;">Relevance: ${insight.relevanceScore}/10</p>
        
        <p style="margin: 15px 0; line-height: 1.6;">${insight.summary}</p>
        
        <div style="background-color: #fff; padding: 15px; border-left: 3px solid #00b294; margin-top: 15px;">
          <strong style="color: #00b294;">💡 Design implications</strong>
          <p style="margin: 10px 0 0 0; line-height: 1.6;">${insight.designImplications}</p>
        </div>
        
        ${insight.sourceArticles && insight.sourceArticles.length > 0 ? `
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            <em>Sources: ${insight.sourceArticles.join(', ')}</em>
          </p>
        ` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 700px; margin: 0 auto;">
          <h1 style="color: #0078d4; border-bottom: 3px solid #0078d4; padding-bottom: 10px;">
            🤖 AI News Digest: Design Insights
          </h1>
          <p style="color: #666; margin: 10px 0 30px 0;">
            ${analysis.analyzedAt.toLocaleDateString()} • ${analysis.articlesProcessed} articles analyzed
          </p>
          
          ${insightsHTML}
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>📰 <a href="https://news.smol.ai/" style="color: #0078d4; text-decoration: none;">View full news</a> • Powered by Azure AI Foundry</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildEmailText(analysis: AnalysisResult): string {
    const insightsText = analysis.insights.map((insight, idx) => `
${idx + 1}. ${insight.title}
Relevance: ${insight.relevanceScore}/10

${insight.summary}

💡 Design implications:
${insight.designImplications}

${insight.sourceArticles && insight.sourceArticles.length > 0 ? `Sources: ${insight.sourceArticles.join(', ')}` : ''}

${'━'.repeat(50)}
    `).join('\n');

    return `
🤖 AI News Digest: Design Insights
${analysis.analyzedAt.toLocaleDateString()} • ${analysis.articlesProcessed} articles analyzed

${'━'.repeat(50)}

${insightsText}

📰 View full news: https://news.smol.ai/
Powered by Azure AI Foundry
    `.trim();
  }
}
