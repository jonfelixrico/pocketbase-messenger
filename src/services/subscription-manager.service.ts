import { RecordSubscription, UnsubscribeFunc } from 'pocketbase'
import { filter, map, Observable, Subject } from 'rxjs'
import { PbCollection } from 'src/models/pb-collection.enum'
import { usePocketbase } from './pocketbase.service'

interface GenericRecordSubscription extends RecordSubscription<unknown> {
  collection: string
}

const subject = new Subject<GenericRecordSubscription>()
const unsubscribers: Record<string, UnsubscribeFunc> = {}

export function useSubscriptionManager() {
  const pb = usePocketbase()

  function unsubscribe() {
    console.debug('Starting the unsubscription process...')

    for (const key in unsubscribers) {
      unsubscribers[key]()
      delete unsubscribers[key]
      console.debug('Unsubscribed to %s', key)
    }

    console.log('Killed all subscriptions.')
  }

  async function createSubscription(collection: PbCollection) {
    try {
      const unsubscriber = await pb
        .collection(collection)
        .subscribe('*', (event) => {
          subject.next({
            ...event,
            collection,
          })
        })

      console.debug('Created subscription to collection %s', collection)
      unsubscribers[collection] = unsubscriber
    } catch (e) {
      console.error(
        'Error encountered while trying to subscribe to collection %s',
        collection
      )
    }
  }

  function getSubscription<T>(
    collection: PbCollection
  ): Observable<RecordSubscription<T>> {
    if (!unsubscribers[collection]) {
      /*
       * Intended to be ran asynchronously since there's no point in trying to await
       * the subscription anyway because of its realtime nature.
       */
      createSubscription(collection)
    }

    return subject.pipe(
      filter((event) => event.collection === collection),
      map(({ action, record }) => {
        return {
          action,
          record: record as T, // we'll just trust the caller that they gave the proper type
        }
      })
    )
  }

  return {
    unsubscribe,
    getSubscription,
  }
}
