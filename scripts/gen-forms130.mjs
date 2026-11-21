// Prints the <form name="acord130"> detection block for public/__forms.html from the questionnaire spec (field names only).
import { allKeys130, FORM_NAME_130 } from '../src/lib/acord130Spec.ts'
const inputs = allKeys130().map(k => `      <input name="${k}" type="text" />`).join('\n')
console.log(`    <form name="${FORM_NAME_130}" data-netlify="true" netlify-honeypot="bot-field" hidden>\n      <input type="hidden" name="form-name" value="${FORM_NAME_130}" />\n      <input name="bot-field" />\n${inputs}\n    </form>`)
