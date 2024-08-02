import { useEffect, useState } from "react";
import axios from "axios";
import {Link} from 'react-router-dom';
function IndexPage() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    axios.get('/places')
      .then(response => {
        setPlaces([...response.data]);
      })
      .catch(error => {
        console.error('Error fetching places:', error);
      });
  }, []);

  return (
    <div className="grid gird-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 mt-8 mb-2">
      {places.length > 0 && places.map(place => (
        <Link key="" to={'/place/'+place._id}>
          <div key={place._id}>
            <div className="bg-gray-500 rounded-2xl flex">
              {place.photos?.[0] && (
                <img className="rounded-2xl object-cover aspect-square" src={'http://localhost:4000/uploads/' + place.photos[0]} alt="" />
              )}
              
            </div>
            <h2 className="text-sm truncate">{place.title}</h2>
            <h3 className="font-bold truncate text-gray-500">{place.address}</h3>
            <div className="mt-1">
              <span className="font-bold">${place.price} per night</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default IndexPage;
