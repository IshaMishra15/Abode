import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BookingWidget from '../BookingWidget';
import PlaceGalary from '../PlaceGalary';
import AddressLink from '../AddressLink';

export default function PlacePage() {
    const { placeId } = useParams();
    const { id } = useParams();
    const [place, setPlace] = useState(null);

    useEffect(() => {
        if (!id) {
            return;
        }
        axios.get(`/places/${id}`).then(response => {
            setPlace(response.data);
            console.log("placepage",response.data);
        });
    }, [id]);

    if (!place) return '';

    return (
        <div className='mt-4 bg-gray-100 -mx-8 py-8 px-8 ' >
            <h1 className='text-2xl'>{place.title}</h1>
            <AddressLink>{place.address}</AddressLink>
            <PlaceGalary place={place}/>
            <div className='mb-8 mt-8 gap-8 grid grid-cols-1 md:grid-cols-[2fr_1fr]'>
                <div>
                    <div className='my-4'>
                        <h2 className='font-semibold text-2xl'>Description</h2>
                        {place.description}
                    </div>
                    Check-in: {place.checkIn}:00<br />
                    Check-out: {place.checkOut}:00<br />
                    Maximum number of guests: {place.maxGuests}<br />
                </div>
                <div>
                    <BookingWidget place={place} />
                </div>
            </div>
            <div className="bg-white px-8 py-8 -mx-8 border-t">
                <div>
                    <h2 className='mt-4 font-semibold text-2xl'>Extra Info</h2>
                </div>
                <div className='text-sm text-gray-700 leading-5 mb-4 mt-2'>{place.extraInfo}</div>
            </div>
            <h1 className='mt-4 font-semibold text-2xl pb-4'>Let's Connect ...</h1>
            
            <div className="relative inline-block p-2 rounded-lg border-4 border-gray-400 hover:border-primary ">
    <img
        src="https://th.bing.com/th/id/OIP.Cb6Y_-8z_qynypQmCEacpQHaE7?w=268&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
        alt=""
        className="w-full rounded-lg filter blur-sm"
    />
    <a href={`/lobby/${id}`} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 z-10">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full text-black hover:text-primary transition-colors duration-300 ease-in-out shadow-lg hover:shadow-xl"
        >
            <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
        </svg>
    </a>
    <span className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold z-0 ">Live tour, real talk</span>
</div>


        </div>
    );
}


