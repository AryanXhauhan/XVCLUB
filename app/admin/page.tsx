



import OrderTable from '@/components/admin/OrderTable';

// Temporary demo mode for testing UI
export default function AdminDashboardPage() {
    return (
        <div className="editorial-container py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-headline text-xvc-black mb-2">Orders</h1>
                <p className="text-xvc-graphite">Manage your dropshipping orders</p>
            </div>
            <OrderTable />
        </div>
    );
}

