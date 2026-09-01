'use client';

import AdminTourEditPage from '@/admin/pages/tours/edit';

/**
 * The tour's id travels as a route parameter, and the screen reads it with
 * `useParams` exactly as the other modules do — the shim keeps the same key.
 */
export default function Page() {
    return <AdminTourEditPage />;
}
