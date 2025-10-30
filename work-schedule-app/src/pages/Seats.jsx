import { OFFICE_SEATS } from '../data/constants';

function Seats() {
    // Групиране на местата по group property
    const groupedSeats = OFFICE_SEATS.reduce((acc, seat) => {
        const group = seat.group || 1;
        if (!acc[group]) acc[group] = [];
        acc[group].push(seat);
        return acc;
    }, {});

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪑 Офис места</h1>
            </div>

            <div className="office-seats-container">
                {Object.entries(groupedSeats).map(([groupNum, seats]) => (
                    <div key={groupNum} className="office-seats-group">
                        <div className="office-seats-grid">
                            {seats.map((seat, index) => (
                                <div key={index} className="office-seat">
                                    <div className="seat-number">{seat.number}</div>
                                    <div className={seat.name === 'Свободно' ? 'seat-empty' : 'seat-name'}>
                                        {seat.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Seats;


