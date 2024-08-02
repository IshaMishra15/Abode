import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from "react";
import { differenceInCalendarDays } from 'date-fns';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { UserContext } from './UserContext';
export default function BookingWidget({ place }) {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [numberOfGuests, setNumberOfGuests] = useState(1);
    const[redirect,setRedirect]=useState('');
    const {user}=useContext(UserContext);
    useEffect(()=>{
        setName(user.name);
    },[user]);

    let numberOfNights = 0;
    if (checkIn && checkOut) {
        numberOfNights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
        if (numberOfNights < 0) {
            numberOfNights = 0;
        }
    }
    async function bookThisPlace(){
        const response=await axios.post('/bookings',{checkIn,checkOut,numberOfGuests,name,phone,place:place._id,price:numberOfNights*place.price,});
        const bookingId=response.data._id;
        setRedirect(`/account/bookings/${bookingId}`);
    }
    if(redirect)
    {
        return <Navigate to={redirect}/>
    }

    return (
        <div className='bg-white p-4 rounded-2xl shadow'>
            <div className='text-2xl text-center'>
                Price: ${place.price} / per night
            </div>
            <div className='border rounded-2xl mt-4'>
                <div className="flex">
                    <div className='py-3 px-4 '>
                        <label htmlFor="">Check in : </label>
                        <input type="date"
                            value={checkIn}
                            onChange={ev => setCheckIn(ev.target.value)} />
                    </div>
                    <div className='py-3 px-4 border-l'>
                        <label htmlFor="">Check out : </label>
                        <input type="date"
                            value={checkOut}
                            onChange={ev => setCheckOut(ev.target.value)} />
                    </div>
                </div>
                <div className='py-3 px-4 border-t'>
                    <label htmlFor="">Number of guests : </label>
                    <input type="number"
                        value={numberOfGuests}
                        onChange={ev => setNumberOfGuests(ev.target.value)} />
                </div>
                {numberOfNights > 0 && (
                    <div className='py-3 px-4 border-t'>
                        <label htmlFor="">Your full name : </label>
                        <input type="text"
                            value={name}
                            onChange={ev => setName(ev.target.value)} />
                        <label htmlFor="">Phone Number:</label>
                        <input type="tel" value={phone} onChange={ev => setPhone(ev.target.value)} />
                    </div>
                )}
            </div>
            <button onClick={bookThisPlace}className='primary mt-4'>
                Book this place
                {numberOfNights > 0 && (
                    <span> ${numberOfNights * place.price}</span>
                )}
            </button>
        </div>
    );
}

BookingWidget.propTypes = {
    place: PropTypes.shape({
        price: PropTypes.number.isRequired,
    }).isRequired,
};
