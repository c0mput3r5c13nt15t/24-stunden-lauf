import React, { useState } from 'react';
import Layout from '../../components/layout';
import { useSession } from 'next-auth/react';
import AccessDenied from '../../components/accessDenied';
import { useToasts } from 'react-toast-notifications';
import Link from 'next/link';

const houseNames = process.env.HOUSES?.split(',') || ['Extern'];
const gradeNames = process.env.GRADES?.split(',') || ['Keine Klasse'];

export default function CreateRunnerPage() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [house, setHouse] = useState('Extern');
  const [grade, setGrade] = useState('Keine Klasse');
  const [newNumber, setNewNumber] = useState(0);
  const { addToast } = useToasts();

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setHouse('');
    setGrade('');
    setNewNumber(0);
    document.getElementById('firstName')?.focus();
  };

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const body = {
        firstName: firstName,
        lastName: lastName,
        house: house,
        grade: grade
      };
      const res = await fetch(`/api/runners/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.status === 200) {
        const json = await res.json();
        addToast('Läufer erfolgreich erstellt', {
          appearance: 'success',
          autoDismiss: true
        });
        setNewNumber(json.number);
      } else if (res.status === 400) {
        const json = await res.json();
        if (json.error) {
          addToast(json.error, {
            appearance: 'error',
            autoDismiss: true
          });
        } else {
          addToast('Ein Fehler ist aufgeregteren', {
            appearance: 'error',
            autoDismiss: true
          });
        }
      } else if (res.status === 403) {
        addToast('Fehlende Berechtigung', {
          appearance: 'error',
          autoDismiss: true
        });
      } else {
        const json = await res.json();
        addToast(json.error.toString(), {
          appearance: 'success',
          autoDismiss: true
        });
      }
    } catch (error) {
      addToast('Ein Fehler ist aufgeregteren', {
        appearance: 'error',
        autoDismiss: true
      });
    }
  };

  // When rendering client side don't display anything until loading is complete
  if (typeof window !== 'undefined' && loading) return null;

  // If the user is not authenticated or does not have the correct role, display access denied message
  if (!session || session.userRole !== 'superadmin') {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  return (
    <Layout>
      {newNumber ? (
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Der Läufer bekommt die Startnummer</h2>
            <h1 className="w-full text-center my-4 text-6xl font-['Roboto_Slab'] tracking-widest">{newNumber}</h1>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={resetForm}>
                Okay
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card w-11/12 max-w-sm bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Läufer hinzufügen</h2>
            <form onSubmit={submitData}>
              <label className="label">
                <span className="label-text">Vorname*</span>
              </label>
              <input
                name={'firstName'}
                className="input input-bordered w-full max-w-xs"
                autoFocus
                onChange={(e) => setFirstName(e.target.value)}
                type={'text'}
                value={firstName}
                required
              />
              <label className="label">
                <span className="label-text">Nachname*</span>
              </label>
              <input
                name={'lastName'}
                className="input input-bordered w-full max-w-xs"
                onChange={(e) => setLastName(e.target.value)}
                type={'text'}
                value={lastName}
                required
              />
              <label className="label">
                <span className="label-text">Haus*</span>
              </label>
              <select
                name={'house'}
                className="select select-bordered w-full max-w-xs"
                onChange={(e) => setHouse(e.target.value)}
                value={house}
                required
              >
                {houseNames.map((houseName) => (
                  <option key={houseName} value={houseName}>
                    {houseName}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text">Klasse</span>
              </label>
              <select
                name={'garde'}
                className="select select-bordered w-full max-w-xs"
                onChange={(e) => setGrade(e.target.value)}
                value={grade}
                required
              >
                {gradeNames.map((gradeName) => (
                  <option key={gradeName} value={gradeName}>
                    {gradeName}
                  </option>
                ))}
              </select>
              <div className="mt-4">
                <div className="flex gap-y-2 w-full justify-evenly flex-col sm:flex-row">
                  <input
                    className="btn btn-primary"
                    type={'submit'}
                    value={'Hinzufügen'}
                    disabled={!firstName || !lastName || !house || !grade}
                  />
                  <Link href={'/runners'}>
                    <a className={'btn btn-outline btn-error'}>Abbrechen</a>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
