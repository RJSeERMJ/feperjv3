import React from 'react';
import { useSelector } from 'react-redux';
import { selectPlates } from '../../logic/barLoad';
import { RootState } from '../../store/barraProntaStore';
import { LoadedPlate, Lift } from '../../types/barraProntaTypes';
import './BarLoad.css';

interface BarLoadProps {
  weightKg: number;
  rackInfo?: string;
}

const BarLoad: React.FC<BarLoadProps> = ({ weightKg, rackInfo }) => {
  const { lift } = useSelector((state: RootState) => state.lifting);
  const meet = useSelector((state: RootState) => state.meet);
  
  // Obter peso da barra + colares baseado no movimento
  const getBarAndCollarsWeight = (): number => {
    switch (lift) {
      case 'S':
        return meet.squatBarAndCollarsWeightKg;
      case 'B':
        return meet.benchBarAndCollarsWeightKg;
      case 'D':
        return meet.deadliftBarAndCollarsWeightKg;
      default:
        return 20;
    }
  };

  // Calcular anilhas necessárias
  const loading = selectPlates(weightKg, getBarAndCollarsWeight(), meet.plates, true);

  // Função para obter o texto do peso
  const getWeightText = (weight: number): string => {
    if (weight < 0) return `?${Math.abs(weight)}`;
    
    switch (weight) {
      case 1.25: return '1¼';
      case 0.75: return '¾';
      case 0.5: return '½';
      case 0.25: return '¼';
      default: return weight.toString();
    }
  };

  // Função para renderizar as anilhas
  const renderPlates = (loading: LoadedPlate[]) => {
    const divs = [];
    let i = 0;

    // Iterar sobre um grupo de anilhas do mesmo peso por vez
    while (i < loading.length) {
      const weightAny = loading[i].weightAny;

      // Se o peso é negativo, é um relatório de erro
      if (weightAny < 0) {
        divs.push(
          <div key="error" className="plate-error">
            ?{Math.abs(weightAny)}
          </div>
        );
        break;
      }

      // Contar quantas vezes este mesmo tipo de anilha aparece consecutivamente
      let plateCount = 1;
      for (let j = i + 1; j < loading.length && loading[j].weightAny === weightAny; j++) {
        plateCount++;
      }

      // Se essa anilha é grande e ocorre várias vezes, mostrar um contador
      const showCounter = plateCount >= 3;

      // Empurrar cada uma das anilhas individualmente
      for (let j = 0; j < plateCount; j++) {
        const plate = loading[i + j];
        const counter = String(j + 1);

        // Fundos claros precisam de texto escuro
        const isLight = plate.color === '#FFFFFF' || plate.color === '#FFFF00';

        const style = {
          backgroundColor: plate.color,
          opacity: plate.isAlreadyLoaded ? 0.25 : undefined,
          color: isLight ? '#232323' : '#FFFFFF',
          // Anilhas brancas precisam de borda
          border: plate.color === '#FFFFFF' ? '1.5px solid #232323' : undefined,
        };

        divs.push(
          <div
            key={weightAny + '-' + counter}
            className={`plate plate-${weightAny}`}
            style={style}
          >
            <div className="plate-weight">{getWeightText(weightAny)}</div>
            {showCounter && <div className="plate-counter">{counter}</div>}
          </div>
        );
      }

      i += plateCount;
    }

    return divs;
  };

  // Renderizar informações do rack (apenas para agachamento e supino)
  const renderRackInfo = () => {
    if (lift === 'D' || !rackInfo) return null;

    return (
      <div className="rack-info">
        Rack {rackInfo}
      </div>
    );
  };

  return (
    <div className="bar-load-container">
      <div className="bar bar-left" />
      <div className="plates-container">
        {renderPlates(loading)}
      </div>
      <div className="collar" />
      <div className="bar bar-right" />
      {renderRackInfo()}
    </div>
  );
};

export default BarLoad;
