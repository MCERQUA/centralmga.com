// Prints the <form name="acord131"> detection block for public/__forms.html from the questionnaire spec (field names only).
import { allKeys131, FORM_NAME_131 } from '../src/lib/acord131Spec.ts'
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const inputs = allKeys131().map(k => `      <input name="${esc(k)}" type="text" />`).join('\n')
console.log(`    <form name="${FORM_NAME_131}" data-netlify="true" netlify-honeypot="bot-field" hidden>\n      <input type="hidden" name="form-name" value="${FORM_NAME_131}" />\n      <input name="bot-field" />\n${inputs}\n    </form>`)
