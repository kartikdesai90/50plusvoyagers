'use client';

import AdminGalleryEditPage from '@/admin/pages/gallery/edit';

/**
 * The record's id travels as a route parameter, and the screen reads it with
 * `useParams` exactly as it always did — the shim keeps the same key.
 */
export default function Page() {
    return <AdminGalleryEditPage />;
}
