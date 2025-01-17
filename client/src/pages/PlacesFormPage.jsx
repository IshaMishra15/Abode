import {useEffect, useState} from 'react'
import PhotosUploader from "../PhotosUploader";
import Perks from "../Perks";
import axios from 'axios';
import AccountNav from '../AccountNav';
import { Navigate, useParams } from 'react-router-dom';


export default function PlacesFormPage() {
    const{id}=useParams();
    console.log({id});
    const[title,setTitle]=useState('');
    const [address,setAddress]=useState('');
    const[addedPhotos,setAddedPhotos]=useState([]);
    const[description,setDescription]=useState('');
    const[perks,setPerks]=useState([]);
    const[extraInfo,setExtraInfo]=useState('');
    const[checkIn,setCheckIn]=useState('');
    const[checkOut,setCheckOut]=useState('');
    const[maxGuests,setMaxGuests]=useState(1);
    const [redirect,setRedirect]=useState(false);
    const [price,setPrice]=useState(100);
    useEffect(()=>{
        if(!id){
            return;
        }
        axios.get('/places/'+id)
        .then(response=>{
            const{data}=response;
            setTitle(data.title);
            setAddress(data.address);
            setAddedPhotos(data.photos);
            setDescription(data.description);
            setPerks(data.perks);
            setExtraInfo(data.extraInfo);
            setCheckIn(data.checkIn);
            setCheckOut(data.checkOut);
            setMaxGuests(data.maxGuests);
            setPrice(data.price);
        });
    },[id])
    function inputHeader(text){
        return (
            <h2 className="text-2xl mt-4">{text}</h2>
        )
    }
    function inputDescription(text){
        return(
            <p className="text-gray-500 text-sm">{text}</p>
        )
    }
    function preInput(header,description){
        return(
            <>
                {inputHeader(header)}
                {inputDescription(description)}
            </>
        )
    }
    // async function savePlace(ev){
    //     ev.preventDefault();
    //     const placeData={title,address,addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price,};
    //     if(id){
    //         //update
    //         await axios.put('/places',{
    //             id,...placeData
                
    //         });
    //         setRedirect(true);
    //     }
    //     else{
    //         //new place
    //         await axios.post('/places',placeData);
    //         setRedirect(true);
    //     }
        
    // }
    async function savePlace(ev) {
        ev.preventDefault();
        
        const placeData = {
            title,
            address,
            addedPhotos,
            description,
            perks,
            extraInfo,
            checkIn,
            checkOut,
            maxGuests,
            price,
        };
    
        console.log('Saving place data:', placeData);
    
        try {
            if (id) {
                // Update existing place
                const response = await axios.put('/places', {
                    id,
                    ...placeData
                });
                console.log('Update response:', response);
            } else {
                // Create new place
                const response = await axios.post('/places', placeData);
                console.log('Create response:', response);
            }
            setRedirect(true);
        } catch (error) {
            console.error('Error saving place:', error.response || error);
        }
    }
    
    if(redirect){
        return <Navigate to={'/account/places'}/>
    }
  return (
    <div>
        <AccountNav></AccountNav>
    <form onSubmit={savePlace}>
                        {preInput('Title','Title of your place. It should be short and catchy as in advertisement')}
                        <input value={title} onChange={ev=>setTitle(ev.target.value)}type="text" placeholder="title,for example: My lovely apartment"/>
                        {preInput('Address','Address of your place.')}
                        <input type="text" placeholder="address" value={address} onChange={ev=>setAddress(ev.target.value)}/>
                        {preInput('Photos','Photos of your place.')}
                        <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos}/>
                        
                        {preInput('Description','Description of your place. It should be short and catchy as in advertisement')}
                        <textarea value={description} onChange={ev=>setDescription(ev.target.value)}/>
                        {preInput('Perks','Select all the perks of your place')}
                        <Perks selected={perks} onChange={setPerks}/>
                        {preInput('Extra Info','Add extra info about the place like rules etc.')}
                        <textarea value={extraInfo} onChange={ev=>setExtraInfo(ev.target.value)}/>
                        {preInput('Check in&out times, max guests','Add check in and out times,remember to have some time window for cleaning the room between guests')}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            
                            <div>
                            <h3 className="mt-2 -mb-1">Check in time</h3>
                                <input type="text" placeholder="14:00"
                                value={checkIn} onChange={ev=>setCheckIn(ev.target.value)}/>
                            </div>
                            <div>
                            <h3 className="mt-2 -mb-1">Check out time</h3>
                                <input type="text" value={checkOut} onChange={ev=>setCheckOut(ev.target.value)}/>
                            </div>
                            <div>
                            <h3 className="mt-2 -mb-1">Maximum number of guests</h3>
                                <input type="number" value={maxGuests} onChange={ev=>setMaxGuests(ev.target.value)}/>
                            </div>
                            <div>
                            <h3 className="mt-2 -mb-1">Price per night</h3>
                                <input type="number" value={price} onChange={ev=>setPrice(ev.target.value)}/>
                            </div>
                        </div>
                        <div>
                            <button className="primary my-4">Save</button>
                        </div>
                    </form>
                </div>
  )
}
