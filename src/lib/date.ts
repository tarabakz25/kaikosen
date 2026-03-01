/**
 * API/DBから受け取る日時文字列をUTCとして解釈する。
 * Supabase/PostgresのtimestampはUTCで保存されるが、JSONシリアライズ時に
 * タイムゾーン情報が欠落することがあり、その場合ローカル時刻として誤解釈される。
 */
export function parseUtc(d: string | Date | null | undefined): Date {
	if (d == null) return new Date(NaN);
	if (d instanceof Date) return d;
	const s = String(d).trim();
	if (!s) return new Date(NaN);
	if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
	return new Date(s + 'Z');
}
