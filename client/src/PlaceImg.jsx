import PropTypes from 'prop-types';

export default function PlaceImg({ place, index = 0, className = 'object-cover' }) {
    if (!place || !place.photos || place.photos.length === 0) {
        return <div>No Image Available</div>; // Handle empty or missing images
    }

    return (
        <img
            className={className}
            src={`http://localhost:4000/uploads/${place.photos[index]}`}
            alt="Place"
        />
    );
}

PlaceImg.propTypes = {
    place: PropTypes.shape({
        photos: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired,
    index: PropTypes.number,
    className: PropTypes.string
};

PlaceImg.defaultProps = {
    index: 0,
    className: 'object-cover'
};
