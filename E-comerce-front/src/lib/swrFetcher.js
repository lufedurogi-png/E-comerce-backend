import axios from '@/lib/axios'

/**
 * Fetcher para SWR que usa axios.
 * Extrae data del formato { success, data } de la API.
 */
export async function swrFetcher(url) {
    const res = await axios.get(url)
    return res.data?.data ?? res.data
}
