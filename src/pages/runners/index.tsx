import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import AccessDenied from '../../components/accessDenied';
import { prisma } from '../../../prisma';
import { Group, Runner, Lap } from '@prisma/client';
import { IoTrashOutline } from 'react-icons/io5';
import { useToasts } from 'react-toast-notifications';

interface RunnerWithGroupAndLaps extends Runner {
  group?: Group;
  laps?: Lap[];
}

export async function getServerSideProps(_context: any) {
  let runners = await prisma.runner.findMany({
    include: {
      group: true,
      laps: true
    },
    orderBy: {
      laps: {
        _count: 'desc'
      }
    }
  });
  runners = JSON.parse(JSON.stringify(runners));
  return { props: { runners } };
}

export default function IndexRunnerPage({ init_runners }: { init_runners: RunnerWithGroupAndLaps[] }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const [runners, setRunners] = useState(init_runners);
  const { addToast } = useToasts();

  // Fetch users from protected route
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/runners');
      if (res.status === 200) {
        const json = await res.json();
        setRunners(json.data);
      } else {
        addToast('Ein Fehler ist aufgeregteren', {
          appearance: 'error',
          autoDismiss: true
        });
      }
    };
    fetchData();
  }, [addToast, session]);

  const handleDelete = async (number: number) => {
    const res = await fetch(`/api/runners/${number}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (res.status === 200) {
      const newContent = runners.filter((runner) => runner.number !== number);
      setRunners(newContent);
      addToast('Läufer erfolgreich gelöscht', {
        appearance: 'success',
        autoDismiss: true
      });
    } else if (res.status === 403) {
      addToast('Fehlende Berechtigung', {
        appearance: 'error',
        autoDismiss: true
      });
    } else if (res.status === 404) {
      addToast('Läufer nicht gefunden', {
        appearance: 'error',
        autoDismiss: true
      });
    } else {
      addToast('Ein Fehler ist aufgeregteren', {
        appearance: 'error',
        autoDismiss: true
      });
    }
  };

  // When rendering client side don't display anything until loading is complete
  if (typeof window !== 'undefined' && loading) return null;

  // If the user is not authenticated or does not have the correct role, display access denied message
  if (!session || (session.userRole !== 'helper' && session.userRole !== 'superadmin')) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={'form table-form'}>
        <h1 className={'formHeading'}>Läufer</h1>
        <div className={'tableWrapper'}>
          <table>
            <thead>
              <tr>
                <th>Startnummer</th>
                <th>Vorname</th>
                <th>Nachname</th>
                <th>Klasse</th>
                <th>Gruppe</th>
                <th>Runden</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {runners &&
                runners.map((runner) => (
                  <tr key={runner.number}>
                    <td>{runner.number}</td>
                    <td>{runner.firstName}</td>
                    <td>{runner.lastName}</td>
                    <td>{runner.grade}</td>
                    <td>{runner.group?.name}</td>
                    <td>{runner.laps?.length}</td>
                    <td>
                      <button className={'deleteButton'} onClick={() => handleDelete(runner.number)}>
                        <IoTrashOutline />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
