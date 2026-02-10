import { create } from 'zustand';

const useBookingStore = create((set, get) => ({
    activeBooking: null,
    bookings: [],

    setActiveBooking: (booking) => {
        set({ activeBooking: booking });
    },

    addBooking: (booking) => {
        set((state) => ({
            bookings: [booking, ...state.bookings],
        }));
    },

    updateBookingStatus: (id, status) => {
        set((state) => ({
            bookings: state.bookings.map((booking) =>
                booking.booking_id === id ? { ...booking, status } : booking
            ),
            activeBooking:
                state.activeBooking?.booking_id === id
                    ? { ...state.activeBooking, status }
                    : state.activeBooking,
        }));
    },

    updateBooking: (booking) => {
        set((state) => ({
            bookings: state.bookings.map((b) =>
                b.booking_id === booking.booking_id ? booking : b
            ),
            activeBooking:
                state.activeBooking?.booking_id === booking.booking_id
                    ? booking
                    : state.activeBooking,
        }));
    },

    setBookings: (bookings) => {
        set({ bookings });
    },

    clearActiveBooking: () => {
        set({ activeBooking: null });
    },
}));

export default useBookingStore;
