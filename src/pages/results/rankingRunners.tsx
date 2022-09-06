import React from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import { prisma } from '../../../prisma';
import { Group, Runner, Lap } from '@prisma/client';
import style from '../../styles/results-scoreboard.module.css';

interface RunnerWithGroupAndLapsCount extends Runner {
  group?: Group;
  _count: {
    laps: number;
  };
}

export async function getServerSideProps(_context: any) {
  let runners = await prisma.runner.findMany({
    include: {
      group: true,
      _count: {
        select: {
          laps: true
        }
      }
    },
    orderBy: [
      {
        laps: {
          _count: 'desc'
        }
      },
      {
        number: 'desc'
      }
    ]
  });
  runners = JSON.parse(JSON.stringify(runners));
  return { props: { runners } };
}

export default function LeaderbordPage({ runners }: { runners: RunnerWithGroupAndLapsCount[] }) {
  const { status } = useSession();
  const loading = status === 'loading';

  // When rendering client side don't display anything until loading is complete
  if (typeof window !== 'undefined' && loading) return null;

  console.log(runners);

  // Make sure runners has a least three elements
  if (runners.length < 3) {
    for (let i = 0; i <= 2; i++) {
      if (!runners[i]) {
        runners[i] = {
          number: i,
          firstName: 'Niemand',
          lastName: '',
          groupUuid: null,
          grade: '',
          _count: {
            laps: 0
          }
        };
      }
    }
  }

  return (
    <Layout>
      <div className={style.leaderboard}>
        <div className="w-11/12 max-w-4xl flex flex-col md:flex-row justify-between items-end my-6 gap-2">
          {runners &&
            [runners[1], runners[0], runners[2]].map((runner: RunnerWithGroupAndLapsCount, index: number) => (
              <div className="w-full stats grow shadow-lg h-44 first:h-36 last:h-32 text-[#d4af37] first:text-[#c0c0c0] last:text-[#bf8970]">
                <div className="stat place-items-center">
                  <div className="stat-title text-black">
                    {runner.firstName} {runner.lastName} ({runner.number})
                  </div>
                  <div className="stat-value">{runners.indexOf(runner) + 1}</div>
                  <div className="stat-desc text-black">
                    {runner._count.laps} {runner._count.laps === 1 ? 'Runde' : 'Runden'}
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="w-11/12 max-w-4xl flex flex-col gap-2">
          {runners &&
            runners.slice(3).map((runner: RunnerWithGroupAndLapsCount, index: number) => (
              <div key={index} className="shadow-md rounded-full flex flex-row items-center justify-between p-1">
                <a className="btn btn-circle btn-outline btn-primary">{index + 3}</a>
                <div>
                  {runner.firstName} {runner.lastName} ({runner.number})
                </div>
                <div className="btn btn-ghost rounded-full">
                  {runner._count.laps} {runner._count.laps === 1 ? 'Runde' : 'Runden'}
                </div>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
}
