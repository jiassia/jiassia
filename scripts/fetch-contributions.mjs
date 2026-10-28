import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const query = `query {
  user(login: "jiassia") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const response = JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], {
  encoding: 'utf8',
  timeout: 90000,
  maxBuffer: 2 * 1024 * 1024,
}));
const calendar = response.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar || response.errors?.length) throw new Error('GitHub contribution calendar is unavailable.');
const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
if (!Number.isSafeInteger(calendar.totalContributions) || calendar.totalContributions < 0 ||
    !Array.isArray(calendar.weeks) || calendar.weeks.length > 54) {
  throw new Error('Unexpected contribution calendar format.');
}
const weeks = calendar.weeks.map(week => ({
  days: week.contributionDays.map(day => {
    const level = levels.indexOf(day.contributionLevel);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        !Number.isSafeInteger(day.contributionCount) || day.contributionCount < 0 || level < 0) {
      throw new Error('Unexpected contribution day format.');
    }
    return { date: day.date, count: day.contributionCount, level };
  }),
}));
writeFileSync(resolve(process.argv[2] || 'contributions.json'), JSON.stringify({
  user: 'jiassia', total: calendar.totalContributions, weeks,
}, null, 2) + '\n');
console.log(`Read ${calendar.totalContributions} contributions across ${weeks.length} weeks.`);
