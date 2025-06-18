export function generateEmailHTML(formData: Record<string, any>): string {
  return `
    <div style="font-family: sans-serif; line-height: 2;">
      <h2>New Eligibility Form Submission</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(formData)
          .map(
            ([key, value]) => `
              <tr>
                <td style="font-weight: bold; padding: 4px 8px; text-transform: capitalize; border: 1px solid #ccc;">
                  ${key}
                </td>
                <td style="padding: 4px 8px; border: 1px solid #ccc;">
                  ${value}
                </td>
              </tr>
            `
          )
          .join('')}
      </table>
    </div>
  `;
}